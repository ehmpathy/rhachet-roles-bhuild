import { given, then, when } from 'test-fns';

import { isGithubAuthTestEnv } from './isGithubAuthTestEnv';

const TEST_CASES: {
  description: string;
  given: { env: NodeJS.ProcessEnv };
  expect: { output: boolean };
}[] = [
  {
    description: 'NODE_ENV=test is a test env',
    given: { env: { NODE_ENV: 'test' } },
    expect: { output: true },
  },
  {
    description: 'a jest worker is a test env, whatever NODE_ENV says',
    given: { env: { NODE_ENV: 'production', JEST_WORKER_ID: '1' } },
    expect: { output: true },
  },
  {
    description: 'a box with neither is not a test env',
    given: { env: { NODE_ENV: 'production' } },
    expect: { output: false },
  },
  {
    description: 'an empty env is not a test env',
    given: { env: {} },
    expect: { output: false },
  },
];

describe('isGithubAuthTestEnv', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the env is read', () => {
        then('it yields the expected verdict', () => {
          expect(isGithubAuthTestEnv({ env: thisCase.given.env })).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
