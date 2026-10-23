import type { PhonePeer } from '@src/domain.objects/phone/PhonePeer';

import { asPhonePeerForms } from './asPhonePeerForms';
import type { PhoneReach } from './getOnePhoneReach';

/**
 * .what = is this peer a contact, or a peer that texted this clone first
 * .why = a contact or an inbound sender may be written with the peer's slug or its serial; both
 *        written forms are checked, so neither a grant nor a reply misses on the form it used
 */
export const isPhonePeerInReach = (input: {
  peer: PhonePeer;
  reach: Pick<PhoneReach, 'contacts' | 'inbound'>;
}): boolean =>
  asPhonePeerForms({ peer: input.peer }).some(
    (form) =>
      input.reach.contacts.includes(form) || input.reach.inbound.includes(form),
  );
