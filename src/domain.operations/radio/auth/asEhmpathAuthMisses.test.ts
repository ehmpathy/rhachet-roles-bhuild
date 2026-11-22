import { asEhmpathAuthMisses } from './asEhmpathAuthMisses';
import type { EhmpathSpotFound } from './EhmpathSpotFound';

const MISS_KEYRACK = {
  row: 'keyrack: not granted (status: locked)',
  fix: 'unlock the robot token',
  cause: null,
};
const MISS_AMBIENT = {
  row: 'ambient: git config user.email unset',
  fix: null,
  cause: null,
};

const TEST_CASES: {
  description: string;
  given: { founds: EhmpathSpotFound[] };
  expect: { row: string; fix: string | null; cause: string | null }[];
}[] = [
  {
    description: 'both spots missed, in read order',
    given: { founds: [{ miss: MISS_KEYRACK }, { miss: MISS_AMBIENT }] },
    expect: [MISS_KEYRACK, MISS_AMBIENT],
  },
  {
    description: 'a spot never read adds no row',
    given: { founds: [null, { miss: MISS_AMBIENT }] },
    expect: [MISS_AMBIENT],
  },
  {
    description: 'a token found adds no row',
    given: { founds: [{ token: 'ghp_fake' }, null] },
    expect: [],
  },
];

describe('asEhmpathAuthMisses', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asEhmpathAuthMisses(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
