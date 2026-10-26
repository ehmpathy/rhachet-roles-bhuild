import { given, then, when } from 'test-fns';

import { asRadioUpstreamReason } from './asRadioUpstreamReason';

const REASON_CASES = [
  {
    description: 'a rejected github token reads as upstream:401',
    given: {
      message:
        'github auth failed: the robot token was rejected by github (401)',
    },
    expect: { output: 'upstream:401' },
  },
  {
    description: 'a gh cli http 401 reads as upstream:401',
    given: { message: 'gh: Bad credentials (HTTP 401)' },
    expect: { output: 'upstream:401' },
  },
  {
    description:
      'a 401 that is no status (a line number) reads as upstream:fault',
    given: { message: 'unexpected token at line 401 of response' },
    expect: { output: 'upstream:fault' },
  },
  {
    description: 'a rate limit reads as upstream:rate-limit',
    given: { message: 'gh: API rate limit exceeded for installation' },
    expect: { output: 'upstream:rate-limit' },
  },
  {
    description: 'a bare http 429 reads as upstream:rate-limit',
    given: { message: 'gh: HTTP 429' },
    expect: { output: 'upstream:rate-limit' },
  },
  {
    description: 'a 429 too many requests reads as upstream:rate-limit',
    given: { message: 'non-200 OK status code: 429 Too Many Requests' },
    expect: { output: 'upstream:rate-limit' },
  },
  {
    description: 'a status 429 reads as upstream:rate-limit',
    given: { message: 'request failed, status: 429' },
    expect: { output: 'upstream:rate-limit' },
  },
  {
    description:
      'a 403 secondary rate limit reads as upstream:rate-limit, not access',
    given: {
      message:
        'HTTP 403: You have exceeded a secondary rate limit. Please wait a few minutes before you try again.',
    },
    expect: { output: 'upstream:rate-limit' },
  },
  {
    description:
      'a 403 abuse detection reads as upstream:rate-limit, not access',
    given: {
      message:
        'HTTP 403: You have triggered an abuse detection mechanism. Please retry your request again later.',
    },
    expect: { output: 'upstream:rate-limit' },
  },
  {
    description: 'a 403 that says retry later reads as upstream:rate-limit',
    given: { message: 'gh: HTTP 403, retry later' },
    expect: { output: 'upstream:rate-limit' },
  },
  {
    description:
      'a 429 that is no status (a line number) reads as upstream:fault',
    given: { message: 'unexpected token at line 429 of response' },
    expect: { output: 'upstream:fault' },
  },
  {
    description: 'a network timeout reads as upstream:transient',
    given: { message: 'connect ETIMEDOUT 140.82.112.3:443' },
    expect: { output: 'upstream:transient' },
  },
  {
    description: 'a gh dial fault reads as upstream:transient',
    given: {
      message:
        'Post "https://api.github.com/graphql": dial tcp: lookup api.github.com: i/o timeout',
    },
    expect: { output: 'upstream:transient' },
  },
  {
    description: 'a github 5xx reads as upstream:transient',
    given: { message: 'gh: Server Error (HTTP 502)' },
    expect: { output: 'upstream:transient' },
  },
  {
    description:
      'an app with no grant on the issue reads as upstream:access (the #599 fault)',
    given: {
      message: 'GraphQL: Resource not accessible by integration (updateIssue)',
    },
    expect: { output: 'upstream:access' },
  },
  {
    description: 'a gh http 403 reads as upstream:access',
    given: { message: 'gh: Forbidden (HTTP 403)' },
    expect: { output: 'upstream:access' },
  },
  {
    description:
      'a repo the auth cannot see reads as upstream:not-found, never as an absent issue',
    given: {
      message:
        "GraphQL: Could not resolve to a Repository with the name 'sandpine/infrastructure'. (repository)",
    },
    expect: { output: 'upstream:not-found' },
  },
  {
    description: 'any other fault reads as upstream:fault',
    given: { message: 'unexpected end of JSON input' },
    expect: { output: 'upstream:fault' },
  },
];

describe('asRadioUpstreamReason', () => {
  REASON_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the upstream error is classified', () => {
        then('it yields the expected reason', () => {
          expect(asRadioUpstreamReason(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
