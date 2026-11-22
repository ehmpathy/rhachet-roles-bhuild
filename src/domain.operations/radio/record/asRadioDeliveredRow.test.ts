import type { EhmpathSpot } from '@src/domain.operations/radio/auth/EhmpathSpot';

import { asRadioDeliveredRow } from './asRadioDeliveredRow';

const TEST_CASES: {
  description: string;
  given: { line: string; ehmpathSpot: EhmpathSpot | null };
}[] = [
  {
    description: 'a row with no spot reads as it always has',
    given: { line: '🟢 book-a-lesson reminder', ehmpathSpot: null },
  },
  {
    description: 'an as-ehmpath row nests the ambient spot beneath it',
    given: { line: '🟢 book-a-lesson reminder', ehmpathSpot: 'ambient' },
  },
  {
    description: 'an as-ehmpath row nests the keyrack spot beneath it',
    given: { line: '🟢 book-a-lesson reminder', ehmpathSpot: 'keyrack' },
  },
];

describe('asRadioDeliveredRow', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const row = asRadioDeliveredRow(thisCase.given);
      expect(row.startsWith(thisCase.given.line)).toBe(true);
      if (thisCase.given.ehmpathSpot)
        expect(row).toContain(
          `auth = as-ehmpath (via ${thisCase.given.ehmpathSpot})`,
        );
      if (!thisCase.given.ehmpathSpot) expect(row).toEqual(thisCase.given.line);
      expect(row).toMatchSnapshot();
    }),
  );
});
