import { PhoneAddress } from '@src/domain.objects/phone/PhoneAddress';

import { asPhoneAddressString } from '../address/asPhoneAddressString';

/**
 * .what = whether a stored contact sits in the typed tree, under a full serial that the short
 *         serial prefixes
 * .why = a contact stored by full serial must be found by the eight-hex prefix a human types
 * .note = only a full serial may match: a slug that merely starts with eight hex (`deadbeef-lead`)
 *         is a different clone, and must never answer to `@:deadbeef`
 */
export const isPhoneContactOfShortSerial = (input: {
  contact: string;
  parsed: PhoneAddress;
}): boolean => {
  const prefixOfTree = asPhoneAddressString(
    new PhoneAddress({ ...input.parsed, clone: '' }),
  );
  if (!input.contact.startsWith(prefixOfTree)) return false;
  const clone = input.contact.slice(prefixOfTree.length);
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
      clone,
    ) && clone.startsWith(input.parsed.clone)
  );
};
