import { given, then, when } from 'test-fns';

import { isGithubRepoUnreachable } from './isGithubRepoUnreachable';

// .note = the texts are gh's own stderr, verbatim, so the match tracks what gh prints
const TEST_CASES = [
  {
    description: 'a repo the auth cannot see is unreachable',
    given: {
      text: "GraphQL: Could not resolve to a Repository with the name 'sandpine/infrastructure'. (repository)",
    },
    expect: { output: true },
  },
  {
    description: 'an absent issue in a reachable repo is not',
    given: {
      text: 'GraphQL: Could not resolve to an issue or pull request with the number of 9999. (repository.issue)',
    },
    expect: { output: false },
  },
  {
    description: 'a rejected token is not',
    given: { text: 'gh: Bad credentials (HTTP 401)' },
    expect: { output: false },
  },
];

describe('isGithubRepoUnreachable', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the gh error text is checked', () => {
        then('it yields the expected verdict', () => {
          expect(isGithubRepoUnreachable(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
