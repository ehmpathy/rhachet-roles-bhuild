import type { PhoneAddress } from '@src/domain.objects/phone/PhoneAddress';

import { asPhoneAddressString } from './asPhoneAddressString';

/**
 * .what = the addresses with each repeat dropped, first-seen order kept
 * .why = a peer named twice in one send is one peer, and gets one text
 */
export const asPhoneAddressesUnique = (input: {
  addresses: PhoneAddress[];
}): PhoneAddress[] => {
  const keys = input.addresses.map(asPhoneAddressString);
  return input.addresses.filter(
    (_, index) => keys.indexOf(keys[index]!) === index,
  );
};
