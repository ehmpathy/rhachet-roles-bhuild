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
 */
export const asPhonePeerRefusal = (input: {
  peer: PhonePeer;
  self: PhoneSelf;
  reach: PhoneReach;
  groveSelf: string;
}): PhoneRefusal | null => {
  const { peer, self, reach } = input;
  const peerString = asPhoneAddressString(peer.address);

  // a clone never texts itself
  if (isPhonePeerSelf({ peer, self }))
    return genPhoneRefusal({
      vibe: 'bummer, that is your own number',
      headline: `${peerString} is this clone`,
      nodes: [{ text: 'text a peer: rhx phone.contacts get' }],
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
      ],
    });

  // a clone in this tree is always admitted
  if (peer.treeDir === self.treeDir) return null;

  // a contact, or a peer that texted this clone first, is admitted by either written form
  if (isPhonePeerInReach({ peer, reach })) return null;

  // refuse, and show who this clone may reach
  return genPhoneRefusal({
    vibe: 'bummer, no such contact',
    headline: `${peerString} is not a contact`,
    nodes: [
      { text: 'you may reach', children: asPhoneReachNodes({ reach }) },
      {
        text: 'grant it, in two steps',
        children: [
          {
            text: 'a human, from any shell in this tree: rhx phone.contacts.uses allow',
          },
          {
            text: `then this clone: rhx phone.contacts set --address ${peerString}`,
          },
        ],
      },
    ],
  });
};
