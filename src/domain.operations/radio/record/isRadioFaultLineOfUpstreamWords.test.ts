import { given, then, when } from 'test-fns';

import { isRadioFaultLineOfUpstreamWords } from './isRadioFaultLineOfUpstreamWords';

/**
 * .what = lines of fault text, each with whether it holds the upstream's words
 * .why = the one test of "is this upstream's words" that both the drain's line pick and the
 *        record's headline lean on; each shape it refuses is named here, directly
 */
const TEST_CASES = [
  {
    description: 'a github graphql refusal is upstream words',
    line: 'GraphQL: Resource not accessible by integration (updateIssue)',
    expected: true,
  },
  {
    description: 'a github http fault is upstream words',
    line: 'HTTP 422: Validation Failed',
    expected: true,
  },
  {
    description: 'a github 401 in its own words is upstream words',
    line: 'HTTP 401: Bad credentials (https://api.github.com/graphql)',
    expected: true,
  },
  {
    description: 'our own exec header is not upstream words',
    line: 'Command failed: gh issue edit 599 --repo sandpine/svc-lessons',
    expected: false,
  },
  {
    description: 'a response header echo is not upstream words',
    line: 'x-github-request-id: 9F3A:1B2C',
    expected: false,
  },
  {
    description: 'a request id under another label is not upstream words',
    line: 'request id 9F3A:1B2C',
    expected: false,
  },
  {
    description:
      'our own constraint error is not upstream words, even when it quotes a github status',
    line: '✋ ConstraintError: github auth failed: the robot token was rejected by github (401)',
    expected: false,
  },
  {
    description: 'our own malfunction error is not upstream words',
    line: '💥 MalfunctionError: gh returned no json',
    expected: false,
  },
  {
    description: 'our own error with no glyph is not upstream words',
    line: 'BadRequestError: no --into supplied',
    expected: false,
  },
  {
    description: 'our own hint bullet is not upstream words',
    line: '• unblock now — re-run as human: --auth as-human',
    expected: false,
  },
];

describe('isRadioFaultLineOfUpstreamWords', () => {
  TEST_CASES.map((thisCase) =>
    given(`a line: ${thisCase.description}`, () => {
      when('[t0] it is asked whether the line holds upstream words', () => {
        then(`it answers ${thisCase.expected}`, () => {
          expect(
            isRadioFaultLineOfUpstreamWords({ line: thisCase.line }),
          ).toEqual(thisCase.expected);
        });
      });
    }),
  );
});
