import type { AuthSource } from '@src/domain.operations/radio/auth/AuthSource';
import { asAuthSourceShown } from '@src/domain.operations/radio/auth/asAuthSourceShown';

import { asRadioNestedLines } from '../asRadioNestedLines';

/**
 * .what = a delivered row, with the source of its identity nested beneath it
 * .why = a send with more than one possible source names which one paid (as-ehmpath's spot,
 *        or the default's as-human email); every other row reads as it always has
 */
export const asRadioDeliveredRow = (input: {
  line: string;
  authSource: AuthSource | null;
}): string => {
  const sourceShown = asAuthSourceShown({ authSource: input.authSource });
  if (!sourceShown) return input.line;
  return asRadioNestedLines({
    head: input.line,
    lines: [`auth = ${sourceShown}`],
  });
};
