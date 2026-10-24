import type { PhoneAddress } from '@src/domain.objects/phone/PhoneAddress';

/**
 * .what = the one written form of an address: keys in fixed order, grove, tree, clone
 * .why = contacts compare by string, so a peer must have exactly one written form
 */
export const asPhoneAddressString = (address: PhoneAddress): string =>
  `phone://grove=${address.grove}/tree=${address.tree}/clone=${address.clone}`;
