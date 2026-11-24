import type { AuthSource } from '@src/domain.operations/radio/auth/AuthSource';

import { asRadioDeliveredRow } from './asRadioDeliveredRow';

const TEST_CASES: {
  description: string;
  given: { line: string; authSource: AuthSource | null };
  expect: { authRow: string | null };
}[] = [
  {
    description: 'a row with no spot reads as it always has',
    given: { line: '🟢 book-a-lesson reminder', authSource: null },
    expect: { authRow: null },
  },
  {
    description: 'an as-ehmpath row nests the ambient spot beneath it',
    given: {
      line: '🟢 book-a-lesson reminder',
      authSource: { auth: 'as-ehmpath', spot: 'ambient' },
    },
    expect: { authRow: 'auth = as-ehmpath (via ambient)' },
  },
  {
    description: 'an as-ehmpath row nests the keyrack spot beneath it',
    given: {
      line: '🟢 book-a-lesson reminder',
      authSource: { auth: 'as-ehmpath', spot: 'keyrack' },
    },
    expect: { authRow: 'auth = as-ehmpath (via keyrack)' },
  },
  {
    description: 'a default as-human row nests the ambient email beneath it',
    given: {
      line: '🟢 book-a-lesson reminder',
      authSource: {
        auth: 'as-human',
        spot: 'ambient',
        email: 'bert@example.com',
      },
    },
    expect: { authRow: 'auth = as-human (via ambient email bert@example.com)' },
  },
];

describe('asRadioDeliveredRow', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const row = asRadioDeliveredRow(thisCase.given);
      expect(row.startsWith(thisCase.given.line)).toBe(true);
      if (thisCase.expect.authRow)
        expect(row).toContain(thisCase.expect.authRow);
      if (!thisCase.expect.authRow) expect(row).toEqual(thisCase.given.line);
      expect(row).toMatchSnapshot();
    }),
  );
});
