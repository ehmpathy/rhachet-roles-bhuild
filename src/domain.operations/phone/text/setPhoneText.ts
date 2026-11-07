import { randomUUID } from 'crypto';
import { MalfunctionError } from 'helpful-errors';

import type { PhoneContactsUsesState } from '@src/access/daos/daoPhoneContactsUses';
import type { PhoneMailboxEntry } from '@src/access/daos/daoPhoneMailbox';
import { PhoneGroup } from '@src/domain.objects/phone/PhoneGroup';
import type { PhonePeer } from '@src/domain.objects/phone/PhonePeer';
import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';
import { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import { asPhoneAddressesUnique } from '../address/asPhoneAddressesUnique';
import { asPhoneAddressFromInput } from '../address/asPhoneAddressFromInput';
import { asPhoneAddressString } from '../address/asPhoneAddressString';
import { getOnePhoneContactsUses } from '../contacts/getOnePhoneContactsUses';
import { setPhoneGroupCopies } from '../group/setPhoneGroupCopies';
import type { PhoneContext } from '../PhoneContext';
import { asPhonePeerRefusal } from '../peer/asPhonePeerRefusal';
import { getAllPhonePeers } from '../peer/getAllPhonePeers';
import { getOnePhoneReach } from '../peer/getOnePhoneReach';
import { genPhoneRefusal } from '../render/genPhoneRefusal';
import { getOnePhoneTextTargets } from './getOnePhoneTextTargets';
import { setPhoneTextCopies } from './setPhoneTextCopies';

/**
 * .what = the most chars one text may carry
 * .why = a text is pasted whole into the peer's session; past this it is a document, and belongs
 *        in a file the text points to
 */
const PHONE_TEXT_CHARS_MAX = 8000;

/**
 * .what = sends a text to one peer or a group: into each receiver seat's inbox, QUEUED, with the
 *         sender's own `out` copy beside it; the receiver tree's daemon says it
 * .why = the send returns at once and the file is the queue, so a dead daemon or a reboot loses
 *        no text. admission is all-or-none: a typo never yields a half-sent group
 *
 * .note = all-or-none covers admission: every peer is checked before any record is written. the
 *         writes follow one per peer, so a crash mid-write may leave part of a group QUEUED (F18)
 * .note = the send keeps no daemon of its own. it returns the dir of each receiver tree on this
 *         grove, so the caller can wake that tree's daemon; a peer on another grove is written
 *         through the grove connection, and its grove's inbox wakes its own daemon
 */
export const setPhoneText = async (
  input: { into: string[]; what: string; re: string | null; self: PhoneSelf },
  context: PhoneContext,
): Promise<{
  entries: PhoneMailboxEntry[];
  duplicates: number;
  group: PhoneGroup | null;
  treeDirsToWake: string[];
}> => {
  const { self } = input;

  // a text must name a peer, or answer a text whose group it may reach
  if (input.into.length === 0 && input.re === null)
    throw genPhoneRefusalOfNoPeer();

  // a text must carry words
  if (!input.what.trim())
    throw genPhoneRefusal({
      vibe: 'bummer, that text is blank',
      headline: 'a text must carry words',
      nodes: [
        { text: "pass words: --what '...', or pipe them: --what @stdin" },
      ],
    });

  // a text must fit in a session
  if (input.what.length > PHONE_TEXT_CHARS_MAX)
    throw genPhoneRefusal({
      vibe: 'whoa, that text is a whole dam',
      headline: `a text holds at most ${PHONE_TEXT_CHARS_MAX} chars; this one holds ${input.what.length}`,
      nodes: [
        { text: 'send the gist, and name a file in the tree for the rest' },
      ],
    });

  // settle who it goes to: peers, a group by name, or the group of the text it answers
  const targets = await getOnePhoneTextTargets({
    into: input.into,
    re: input.re,
    self,
  });

  // a reply to a one-to-one text must still name its peer
  if (targets.raws.length === 0) throw genPhoneRefusalOfNoPeer();

  // cast each address, and look each peer up; a repeated peer is one peer
  const addresses = targets.raws.map((raw) =>
    asPhoneAddressFromInput({
      raw,
      self: { grove: context.groveSelf, tree: self.address.tree },
    }),
  );
  const addressesUnique = asPhoneAddressesUnique({ addresses });
  const peers = await getAllPhonePeers(
    { addresses: addressesUnique, self },
    context,
  );

  // admit each peer, or refuse the whole send
  await assertPhonePeersAdmitted(
    { peers, self, group: targets.group },
    context,
  );

  // a text to several peers rides a group: the one it named, or a new one, written to every member
  const group = targets.group ?? asPhoneGroupNew({ peers, self });
  if (group && !targets.group)
    await setPhoneGroupCopies({ group, peers, self }, context);

  // write each peer's copies, in --into order
  // .note = deliberate mutation: sequential writes, so the mailbox order follows the --into order
  const entries: PhoneMailboxEntry[] = [];
  for (const peer of peers)
    entries.push(
      await setPhoneTextCopies(
        {
          record: new PhoneTextRecord({
            uuid: randomUUID(),
            way: 'out',
            group: group?.uuid ?? null,
            re: targets.re?.record.uuid ?? null,
            from: asPhoneAddressString(self.address),
            to: asPhoneAddressString(peer.address),
            what: input.what,
            status: 'QUEUED',
            reason: null,
          }),
          peer,
          self,
        },
        context,
      ),
    );
  const treeDirsToWake = [
    ...new Set(peers.flatMap((peer) => (peer.treeDir ? [peer.treeDir] : []))),
  ];
  return {
    entries,
    duplicates: addresses.length - addressesUnique.length,
    group,
    treeDirsToWake,
  };
};

/**
 * .what = the refusal of a text that names no one
 */
const genPhoneRefusalOfNoPeer = () =>
  genPhoneRefusal({
    vibe: 'bummer, that text has no one to go to',
    headline: 'a text must name a peer',
    nodes: [
      {
        text: 'pass one or more: --into <address>, or a group: --into group:<id>; see who: rhx phone.contacts get',
      },
    ],
  });

/**
 * .what = a new group of the sender and its peers, for a text to two or more; null for one peer
 */
const asPhoneGroupNew = (input: {
  peers: PhonePeer[];
  self: PhoneSelf;
}): PhoneGroup | null =>
  input.peers.length > 1
    ? new PhoneGroup({
        uuid: randomUUID(),
        members: [
          asPhoneAddressString(input.self.address),
          ...input.peers.map((peer) => asPhoneAddressString(peer.address)),
        ],
      })
    : null;

/**
 * .what = admits every peer, or throws the refusal of the first one refused
 * .note = the meter is read only for a refusal, so its grant names just the steps still owed
 * .note = a group mate is reached by its group alone, as the daemon checks at delivery: only the
 *         members of the group this text goes to are admitted as mates; a lone text admits none
 */
const assertPhonePeersAdmitted = async (
  input: { peers: PhonePeer[]; self: PhoneSelf; group: PhoneGroup | null },
  context: PhoneContext,
): Promise<void> => {
  const { peers, self } = input;
  const reachAll = await getOnePhoneReach({ self }, context);
  const reach = {
    ...reachAll,
    groupMates: reachAll.groupMates.filter(
      (mate) => input.group?.members.includes(mate) ?? false,
    ),
  };
  const asRefusalOf = (one: {
    peer: PhonePeer;
    meter: PhoneContactsUsesState | null;
  }) =>
    asPhonePeerRefusal({
      peer: one.peer,
      self,
      reach,
      meter: one.meter,
      group: peers.length,
    });
  const peerRefused = peers.find(
    (peer) => asRefusalOf({ peer, meter: null }) !== null,
  );
  if (!peerRefused) return;
  const meter = await getOnePhoneContactsUses({ treeDir: self.treeDir });
  throw (
    asRefusalOf({ peer: peerRefused, meter }) ??
    new MalfunctionError(
      'a refused peer read as admitted once the meter was read',
      { peer: asPhoneAddressString(peerRefused.address) },
    )
  );
};
