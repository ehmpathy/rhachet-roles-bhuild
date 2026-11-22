import { asEhmpathSpotShown } from './asEhmpathSpotShown';
import type { EhmpathSpot } from './EhmpathSpot';

const TEST_CASES: {
  description: string;
  given: { ehmpathSpot: EhmpathSpot | null };
  expect: string | null;
}[] = [
  {
    description: 'a keyrack hit names keyrack',
    given: { ehmpathSpot: 'keyrack' },
    expect: 'as-ehmpath (via keyrack)',
  },
  {
    description: 'an ambient hit names ambient',
    given: { ehmpathSpot: 'ambient' },
    expect: 'as-ehmpath (via ambient)',
  },
  {
    description: 'a value with one source shows naught',
    given: { ehmpathSpot: null },
    expect: null,
  },
];

describe('asEhmpathSpotShown', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asEhmpathSpotShown(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
