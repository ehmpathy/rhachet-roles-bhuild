import { randomUUID } from 'crypto';
import { MalfunctionError } from 'helpful-errors';

import type { PhoneContactsUsesState } from '@src/access/daos/daoPhoneContactsUses';
import {
  daoPhoneMailbox,
  type PhoneMailboxEntry,
} from '@src/access/daos/daoPhoneMailbox';
import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';
import { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import { asPhoneAddressesUnique } from '../address/asPhoneAddressesUnique';
import { asPhoneAddressFromInput } from '../address/asPhoneAddressFromInput';
import { asPhoneAddressString } from '../address/asPhoneAddressString';
import { getOnePhoneContactsUses } from '../contacts/getOnePhoneContactsUses';
import type { PhoneContext } from '../PhoneContext';
import { asPhonePeerRefusal } from '../peer/asPhonePeerRefusal';
import { getAllPhonePeers } from '../peer/getAllPhonePeers';
import { getOnePhoneReach } from '../peer/getOnePhoneReach';
import { genPhoneRefusal } from '../render/genPhoneRefusal';
import { getOnePhoneTextByRef } from './getOnePhoneTextByRef';

/**
 * .what = the most chars one text may carry
 * .why = a text is pasted whole into the peer's session; past this it is a document, and belongs
 *        in a file the text points to
 */
const PHONE_TEXT_CHARS_MAX = 8000;

/**
 * .what = sends a text to one peer or a group: one QUEUED `out` record per peer, in this clone's
 *         mailbox; the daemon delivers them
 * .why = the send returns at once and the file is the queue, so a dead daemon or a reboot loses
 *        no text. admission is all-or-none: a typo never yields a half-sent group
 * .note = all-or-none covers admission: every peer is checked before any record is written. the
 *         writes follow one per peer, so a crash mid-write may leave part of a group QUEUED (F18)
 */
export const setPhoneText = async (
  input: { to: string[]; what: string; re: string | null; self: PhoneSelf },
  context: PhoneContext,
): Promise<{ entries: PhoneMailboxEntry[]; duplicates: number }> => {
  const { self } = input;

  // a text must name a peer
  if (input.to.length === 0)
    throw genPhoneRefusal({
      vibe: 'bummer, that text has no one to go to',
      headline: 'a text must name a peer',
      nodes: [
        {
          text: 'pass one or more: --to <address>; see who: rhx phone.contacts get',
        },
      ],
    });

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

  // cast each address, and look each peer up; a repeated peer is one peer
  const addresses = input.to.map((raw) =>
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
  const reach = await getOnePhoneReach({ self }, context);
  const asRefusalOf = (input: {
    peer: (typeof peers)[number];
    meter: PhoneContactsUsesState | null;
  }) =>
    asPhonePeerRefusal({
      peer: input.peer,
      self,
      reach,
      groveSelf: context.groveSelf,
      meter: input.meter,
      group: peers.length,
    });
  const peerRefused = peers.find(
    (peer) => asRefusalOf({ peer, meter: null }) !== null,
  );

  // the meter is read only for a refusal, so its grant names just the steps still owed
  if (peerRefused) {
    const meter = await getOnePhoneContactsUses({ treeDir: self.treeDir });
    throw (
      asRefusalOf({ peer: peerRefused, meter }) ??
      new MalfunctionError(
        'a refused peer read as admitted once the meter was read',
        {
          peer: asPhoneAddressString(peerRefused.address),
        },
      )
    );
  }

  // link a reply to the text it answers, by its full uuid; a blank ref is refused, never dropped
  const re =
    input.re !== null
      ? (await getOnePhoneTextByRef({ raw: input.re, self })).record.uuid
      : null;

  // write one QUEUED record per peer, under one group id when there are several
  const group = peers.length > 1 ? randomUUID() : null;
  // .note = deliberate mutation: sequential writes, so the mailbox order follows the --to order
  const entries: PhoneMailboxEntry[] = [];
  for (const peer of peers)
    entries.push(
      await daoPhoneMailbox.gen({
        treeDir: self.treeDir,
        clone: self.address.clone,
        record: new PhoneTextRecord({
          uuid: randomUUID(),
          way: 'out',
          group,
          re,
          from: asPhoneAddressString(self.address),
          to: asPhoneAddressString(peer.address),
          what: input.what,
          status: 'QUEUED',
          reason: null,
        }),
      }),
    );
  return { entries, duplicates: addresses.length - addressesUnique.length };
};
