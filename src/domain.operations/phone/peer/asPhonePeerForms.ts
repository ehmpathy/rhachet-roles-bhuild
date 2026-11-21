import { PhoneAddress } from '@src/domain.objects/phone/PhoneAddress';
import type { PhonePeer } from '@src/domain.objects/phone/PhonePeer';

import { asPhoneAddressString } from '../address/asPhoneAddressString';

/**
 * .what = every address form a found peer may be written under: its slug form, and its full
 *         serial form when the serial is known
 * .why = a contact or an inbound sender is stored under the name the peer held when it was
 *        written; one transformer names both forms, so admission, grant, and revoke agree
 */
export const asPhonePeerForms = (input: { peer: PhonePeer }): string[] => {
  const formOfSlug = asPhoneAddressString(input.peer.address);
  if (!input.peer.serial) return [formOfSlug];
  const formOfSerial = asPhoneAddressString(
    new PhoneAddress({ ...input.peer.address, clone: input.peer.serial }),
  );
  return [formOfSlug, formOfSerial];
};
