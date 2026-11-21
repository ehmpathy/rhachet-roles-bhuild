import type { PhonePeer } from '@src/domain.objects/phone/PhonePeer';

import { asPhonePeerForms } from './asPhonePeerForms';
import type { PhoneReach } from './getOnePhoneReach';

/**
 * .what = is this peer a contact, a peer that texted this clone first, or a member of a group
 *         this clone is in
 * .why = a contact or an inbound sender may be written with the peer's slug or its serial; both
 *        written forms are checked, so neither a grant nor a reply misses on the form it used
 */
export const isPhonePeerInReach = (input: {
  peer: PhonePeer;
  reach: Pick<PhoneReach, 'contacts' | 'inbound' | 'groupMates'>;
}): boolean =>
  asPhonePeerForms({ peer: input.peer }).some(
    (form) =>
      input.reach.contacts.includes(form) ||
      input.reach.inbound.includes(form) ||
      input.reach.groupMates.includes(form),
  );
