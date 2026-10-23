import { PhoneAddress } from '@src/domain.objects/phone/PhoneAddress';
import { PhonePeer } from '@src/domain.objects/phone/PhonePeer';
import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';
import type { PhoneTreeClone } from '@src/domain.objects/phone/PhoneTreeClone';
import { isGitGroveKnown } from '@src/infra/git/isGitGroveKnown';

import { asPhoneAddressString } from '../address/asPhoneAddressString';
import type { PhoneContext } from '../PhoneContext';
import { genPhoneRefusal } from '../render/genPhoneRefusal';
import { getOnePhoneTreeDir } from '../tree/getOnePhoneTreeDir';
import { isPhoneCloneNamed } from './isPhoneCloneNamed';
import { isPhoneShortSerial } from './isPhoneShortSerial';

/**
 * .what = looks up each address: its grove, its tree, and the clone that answers to it
 * .why = a grant and an admission must both know the peer exists where it says, and compare by
 *        serial; one `clone list` per tree serves every address in that tree
 *
 * .note = a peer on another grove is checked against the grove registry only; its tree and clone
 *         live on that grove's disk, where no local read can reach
 */
export const getAllPhonePeers = async (
  input: { addresses: PhoneAddress[]; self: PhoneSelf },
  context: PhoneContext,
): Promise<PhonePeer[]> => {
  // one clone list per tree dir: the caller's context memoizes the roster (`withPhoneRosterMemo`)
  const getRoster = (treeDir: string): Promise<PhoneTreeClone[]> =>
    context.sdkClone.getAllClones({ treeDir });

  // look up each address in turn, so a refusal names the first bad one
  // .note = deliberate mutation: a sequential await, so the first refusal halts the rest
  const peers: PhonePeer[] = [];
  for (const address of input.addresses)
    peers.push(
      await getOnePeer({ address, self: input.self, getRoster }, context),
    );
  return peers;
};

/**
 * .what = looks up one address
 */
const getOnePeer = async (
  input: {
    address: PhoneAddress;
    self: PhoneSelf;
    getRoster: (treeDir: string) => Promise<PhoneTreeClone[]>;
  },
  context: PhoneContext,
): Promise<PhonePeer> => {
  const { address, self } = input;

  // a peer on another grove: the grove must be known here
  if (address.grove !== context.groveSelf) {
    const isKnown = await isGitGroveKnown({
      forestDir: context.forestDir,
      grove: address.grove,
    });
    if (!isKnown)
      throw genPhoneRefusal({
        vibe: 'bummer, no such grove',
        headline: `no grove ${address.grove} is known on ${context.groveSelf}`,
        nodes: [
          { text: `this grove: ${context.groveSelf}` },
          { text: 'see the known groves: rhx git.grove.list' },
        ],
      });
    return new PhonePeer({
      address,
      treeDir: null,
      serial: null,
      reachState: null,
    });
  }

  // a peer on this grove: its tree must exist here
  const treeDir = await getOnePhoneTreeDir(
    {
      tree: address.tree,
      treeDirSelf: self.treeDir,
      treeSelf: self.address.tree,
    },
    context,
  );
  if (!treeDir)
    throw genPhoneRefusal({
      vibe: 'bummer, no such tree here',
      headline: `no tree ${address.tree} on ${context.groveSelf}`,
      nodes: [
        {
          text: `searched: ${context.gitRoot}/*/_worktrees/ and ${context.gitRoot}/*/`,
        },
        { text: 'see who you may reach: rhx phone.contacts get' },
      ],
    });

  // find the clone that answers to the name: a slug, a full serial, or a short serial
  const roster = await input.getRoster(treeDir);
  const matches = roster.filter((clone) =>
    isPhoneCloneNamed({ clone, name: address.clone }),
  );
  if (matches.length > 1)
    throw genPhoneRefusal({
      vibe: 'bummer, two clones answer to that name',
      headline: `@:${address.clone} matches ${matches.length} clones in ${address.tree}`,
      nodes: [
        ...matches.map((clone) => ({
          text: asPhoneAddressString(
            new PhoneAddress({ ...address, clone: clone.slug ?? clone.serial }),
          ),
        })),
        { text: 'name one by its slug or its full serial' },
      ],
    });
  const match = matches[0] ?? null;

  // a short serial is input only; it must expand, or it names no one
  if (!match && isPhoneShortSerial({ name: address.clone }))
    throw genPhoneRefusal({
      vibe: 'bummer, no clone answers to that serial',
      headline: `no clone answers to @:${address.clone} in ${address.tree}`,
      nodes: [{ text: 'see the roster in that tree: rhx clone list' }],
    });

  return new PhonePeer({
    address: match
      ? new PhoneAddress({ ...address, clone: match.slug ?? match.serial })
      : address,
    treeDir,
    serial: match?.serial ?? null,
    reachState: match?.reachState ?? null,
  });
};
