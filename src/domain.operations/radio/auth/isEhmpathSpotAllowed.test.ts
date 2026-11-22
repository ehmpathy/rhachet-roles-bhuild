import type { EhmpathSpot } from './EhmpathSpot';
import { isEhmpathSpotAllowed } from './isEhmpathSpotAllowed';

const TEST_CASES: {
  description: string;
  given: { via: EhmpathSpot | 'either'; spot: EhmpathSpot };
  expect: boolean;
}[] = [
  {
    description: 'as-ehmpath reads keyrack',
    given: { via: 'either', spot: 'keyrack' },
    expect: true,
  },
  {
    description: 'as-ehmpath reads ambient',
    given: { via: 'either', spot: 'ambient' },
    expect: true,
  },
  {
    description: 'via-keyrack reads keyrack',
    given: { via: 'keyrack', spot: 'keyrack' },
    expect: true,
  },
  {
    description:
      'via-keyrack never reads ambient, so a keyrack fault is never masked',
    given: { via: 'keyrack', spot: 'ambient' },
    expect: false,
  },
  {
    description: 'via-ambient reads ambient',
    given: { via: 'ambient', spot: 'ambient' },
    expect: true,
  },
  {
    description: 'via-ambient never reads keyrack',
    given: { via: 'ambient', spot: 'keyrack' },
    expect: false,
  },
];

describe('isEhmpathSpotAllowed', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isEhmpathSpotAllowed(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
