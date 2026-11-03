import { given, then, when } from 'test-fns';

import { asRadioFaultLineUpstream } from './asRadioFaultLineUpstream';

const TEST_CASES = [
  {
    description: 'no text yields no line',
    given: { text: null },
    expect: { output: null },
  },
  {
    description: 'blank text yields no line',
    given: { text: '\n   \n' },
    expect: { output: null },
  },
  {
    description: 'the exec header yields to the upstream line',
    given: {
      text: 'Command failed: gh issue edit 673\nGraphQL: Resource not accessible by integration (updateIssue)',
    },
    expect: {
      output: 'GraphQL: Resource not accessible by integration (updateIssue)',
    },
  },
  {
    description: 'the first worded line wins, trimmed',
    given: { text: '\n  HTTP 502: Bad Gateway  \nsecond line' },
    expect: { output: 'HTTP 502: Bad Gateway' },
  },
  {
    description: 'a request id header yields to the upstream line after it',
    given: {
      text: 'x-github-request-id: 9F3A:1B2C:77D0\nGraphQL: Resource not accessible by integration (updateIssue)',
    },
    expect: {
      output: 'GraphQL: Resource not accessible by integration (updateIssue)',
    },
  },
  {
    description: 'a request id under another label yields too',
    given: {
      text: 'request id 5A1C-22F0\nHTTP 403: Resource not accessible by integration',
    },
    expect: { output: 'HTTP 403: Resource not accessible by integration' },
  },
  {
    description: 'a request id alone is still shown, as the only line there is',
    given: { text: 'x-github-request-id: 9F3A:1B2C:77D0' },
    expect: { output: 'x-github-request-id: 9F3A:1B2C:77D0' },
  },
  {
    description: 'an exec header alone is kept, as the only words there are',
    given: { text: 'Command failed: gh issue edit 673' },
    expect: { output: 'Command failed: gh issue edit 673' },
  },
  {
    description:
      'our own error and its hint, with no upstream line, fall back to our header (shown, never kept)',
    given: {
      text: '✋ ConstraintError: github auth failed: the robot token was rejected by github (401)\n  • unblock now — re-run as human: --auth as-human',
    },
    expect: {
      output:
        '✋ ConstraintError: github auth failed: the robot token was rejected by github (401)',
    },
  },
  {
    description: 'a refusal wrapped in our own error still yields github line',
    given: {
      text: '💥 MalfunctionError: gh issue edit failed\nGraphQL: Resource not accessible by integration (updateIssue)\n  • check the token scope',
    },
    expect: {
      output: 'GraphQL: Resource not accessible by integration (updateIssue)',
    },
  },
];

describe('asRadioFaultLineUpstream', () => {
  TEST_CASES.map((thisCase) =>
    given(`fault text: ${thisCase.description}`, () => {
      when('[t0] the upstream line is picked', () => {
        then('it yields the expected line', () => {
          const output = asRadioFaultLineUpstream(thisCase.given);
          expect(output).toEqual(thisCase.expect.output);
        });
      });
    }),
  );
});
