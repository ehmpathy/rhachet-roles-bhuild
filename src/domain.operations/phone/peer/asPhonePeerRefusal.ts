import type { PhoneContactsUsesState } from '@src/access/daos/daoPhoneContactsUses';
import type { PhonePeer } from '@src/domain.objects/phone/PhonePeer';
import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';

import { asPhoneAddressString } from '../address/asPhoneAddressString';
import { genPhoneRefusal, type PhoneRefusal } from '../render/genPhoneRefusal';
import { asPhoneReachNodes } from './asPhoneReachNodes';
import type { PhoneReach } from './getOnePhoneReach';
import { isPhonePeerInReach } from './isPhonePeerInReach';
import { isPhonePeerSelf } from './isPhonePeerSelf';

/**
 * .what = the refusal a send to this peer earns, or null when the peer is admitted
 * .why = a clone texts only a contact, a clone in its own tree, or a peer that texted it first;
 *        the refusal shows the peers this clone may reach, so the fix is in the same read
 * .note = `meter` is null where it was not read; the grant then names both steps, since a
 *         lifted meter is not known to be lifted
 */
export const asPhonePeerRefusal = (input: {
  peer: PhonePeer;
  self: PhoneSelf;
  reach: PhoneReach;
  groveSelf: string;
  meter: PhoneContactsUsesState | null;
  group: number;
}): PhoneRefusal | null => {
  const { peer, self, reach } = input;
  const peerString = asPhoneAddressString(peer.address);

  // a group send is admitted whole or refused whole; the refusal says so, so a sender to many
  // never reads one peer's refusal as a send that reached the rest
  const nodesOfGroup =
    input.group > 1
      ? [
          {
            text: `naught was sent: a group of ${input.group} is refused whole`,
          },
        ]
      : [];

  // a clone never texts itself
  if (isPhonePeerSelf({ peer, self }))
    return genPhoneRefusal({
      vibe: 'bummer, that is your own number',
      headline: `${peerString} is this clone`,
      nodes: [{ text: 'text a peer: rhx phone.contacts get' }, ...nodesOfGroup],
    });

  // a peer on another grove rides the grove leg, which this delivery does not carry yet
  if (peer.address.grove !== input.groveSelf)
    return genPhoneRefusal({
      vibe: 'bummer, no river to that grove yet',
      headline: `${peerString} is on another grove`,
      nodes: [
        { text: `this grove: ${input.groveSelf}` },
        {
          text: 'texts across groves ride a later delivery; text a peer on this grove',
        },
        ...nodesOfGroup,
      ],
    });

  // a clone in this tree is always admitted
  if (peer.treeDir === self.treeDir) return null;

  // a contact, or a peer that texted this clone first, is admitted by either written form
  if (isPhonePeerInReach({ peer, reach })) return null;

  // refuse, show who this clone may reach, and name only the grant steps still owed
  const stepGrant = `rhx phone.contacts set --address ${peerString}`;
  const nodeGrant =
    input.meter === 'allowed'
      ? { text: `grant it, as this clone: ${stepGrant}` }
      : {
          text: 'grant it, in two steps',
          children: [
            {
              text: 'a human, from any shell in this tree: rhx phone.contacts.uses allow',
            },
            { text: `then this clone: ${stepGrant}` },
          ],
        };
  return genPhoneRefusal({
    vibe: 'bummer, no such contact',
    headline: `${peerString} is not a contact`,
    nodes: [
      { text: 'you may reach', children: asPhoneReachNodes({ reach }) },
      nodeGrant,
      ...nodesOfGroup,
    ],
  });
};
