import { isGithubIssueAbsent } from './isGithubIssueAbsent';

const TEST_CASES = [
  {
    description: 'an absent issue number is an absence',
    given: {
      text: 'GraphQL: Could not resolve to an issue or pull request with the number of 9999. (repository.issue)',
    },
    expect: { output: true },
  },
  {
    description: 'a dns fault is not an absence',
    given: {
      text: 'error connecting to api.github.com: Could not resolve host: api.github.com',
    },
    expect: { output: false },
  },
  {
    description: 'a repo the auth cannot see is not an absent issue',
    given: {
      text: "GraphQL: Could not resolve to a Repository with the name 'sandpine/svc-lessons'. (repository)",
    },
    expect: { output: false },
  },
  {
    description: 'an absent token is not an absent issue',
    given: { text: 'keyrack: credential not found' },
    expect: { output: false },
  },
  {
    description: 'a rate limit is not an absence',
    given: { text: 'API rate limit exceeded for installation ID 1' },
    expect: { output: false },
  },
];

describe('isGithubIssueAbsent', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isGithubIssueAbsent(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
