import { given, then, when } from 'test-fns';

import { isGithubAuthFailure } from './isGithubAuthFailure';

/**
 * .what = data-driven cases for the gh auth-failure detector
 * .why = lock the exact 401-class signals we treat as auth failures, and the
 *        403 permission signal we deliberately do NOT
 */
const CASES: { desc: string; text: string; expected: boolean }[] = [
  {
    desc: 'raw gh 401 bubble with HTTP 401',
    text: 'Command failed: gh issue create\nHTTP 401: Bad credentials (https://api.github.com/graphql)',
    expected: true,
  },
  {
    desc: 'bad credentials signal',
    text: 'gh: Bad credentials',
    expected: true,
  },
  {
    desc: 'gh session hint to run gh auth login',
    text: 'To get started with GitHub CLI, please run: gh auth login',
    expected: true,
  },
  {
    desc: 'GH_TOKEN env hint (no token / no session)',
    text: 'gh: To use GitHub CLI, set the GH_TOKEN environment variable',
    expected: true,
  },
  {
    desc: 'requires authentication signal',
    text: 'This endpoint requires authentication',
    expected: true,
  },
  {
    desc: 'case-insensitive match',
    text: 'HTTP 401: BAD CREDENTIALS',
    expected: true,
  },
  {
    desc: '403 resource-not-accessible is a permission issue, NOT a token-auth failure',
    text: 'HTTP 403: Resource not accessible by integration',
    expected: false,
  },
  {
    desc: '404 not found is not an auth failure',
    text: 'HTTP 404: Not Found (issue does not exist)',
    expected: false,
  },
  {
    desc: 'network error is not an auth failure',
    text: 'Command failed: getaddrinfo ENOTFOUND api.github.com',
    expected: false,
  },
];

describe('isGithubAuthFailure', () => {
  CASES.forEach((thisCase) => {
    given(`[${thisCase.desc}]`, () => {
      when('[t0] the text is inspected', () => {
        then(`returns ${thisCase.expected}`, () => {
          expect(isGithubAuthFailure({ text: thisCase.text })).toEqual(
            thisCase.expected,
          );
        });
      });
    });
  });
});
