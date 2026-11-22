import { asEhmpathSpotShown } from '@src/domain.operations/radio/auth/asEhmpathSpotShown';
import type { EhmpathSpot } from '@src/domain.operations/radio/auth/EhmpathSpot';

import { asRadioNestedLines } from '../asRadioNestedLines';

/**
 * .what = a delivered row, with the spot an as-ehmpath send paid from nested beneath it
 * .why = as-ehmpath has two possible sources, so its row names which one paid; every
 *        other row reads as it always has
 */
export const asRadioDeliveredRow = (input: {
  line: string;
  ehmpathSpot: EhmpathSpot | null;
}): string => {
  const spotShown = asEhmpathSpotShown({ ehmpathSpot: input.ehmpathSpot });
  if (!spotShown) return input.line;
  return asRadioNestedLines({
    head: input.line,
    lines: [`auth = ${spotShown}`],
  });
};
