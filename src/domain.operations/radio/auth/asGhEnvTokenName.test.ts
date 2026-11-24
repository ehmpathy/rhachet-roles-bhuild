import { asGhEnvTokenName } from './asGhEnvTokenName';

const TEST_CASES: {
  description: string;
  given: { env: NodeJS.ProcessEnv };
  expect: 'GH_TOKEN' | 'GITHUB_TOKEN' | null;
}[] = [
  {
    description: 'an env with neither token names none',
    given: { env: {} },
    expect: null,
  },
  {
    description: 'an env with GH_TOKEN names it',
    given: { env: { GH_TOKEN: 'gho_fake' } },
    expect: 'GH_TOKEN',
  },
  {
    description: 'an env with GITHUB_TOKEN alone names it',
    given: { env: { GITHUB_TOKEN: 'ghs_fake' } },
    expect: 'GITHUB_TOKEN',
  },
  {
    description: 'an env with both names GH_TOKEN, the one gh reads first',
    given: { env: { GH_TOKEN: 'gho_fake', GITHUB_TOKEN: 'ghs_fake' } },
    expect: 'GH_TOKEN',
  },
  {
    description: 'an empty value counts as unset, as gh counts it',
    given: { env: { GH_TOKEN: '' } },
    expect: null,
  },
];

describe('asGhEnvTokenName', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asGhEnvTokenName(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
