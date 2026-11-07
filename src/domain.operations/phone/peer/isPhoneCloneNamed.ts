import type { PhoneTreeClone } from '@src/domain.objects/phone/PhoneTreeClone';

import { isPhoneShortSerial } from './isPhoneShortSerial';

/**
 * .what = does this clone answer to this name: its slug, its full serial, or a short serial
 * .why = a clone with no slug is named by its serial; the first 8 hex of it is the short form a
 *        human types
 */
export const isPhoneCloneNamed = (input: {
  clone: PhoneTreeClone;
  name: string;
}): boolean =>
  input.clone.slug === input.name ||
  input.clone.serial === input.name ||
  (isPhoneShortSerial({ name: input.name }) &&
    input.clone.serial.startsWith(input.name));
