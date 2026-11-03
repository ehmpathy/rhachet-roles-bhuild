import { given, then, when } from 'test-fns';

import { asRadioReasonHeadline } from './asRadioReasonHeadline';

const CASES = [
  {
    description: 'the updateIssue refusal keeps its words (the #591 fault)',
    given: {
      faultText:
        'GraphQL: Resource not accessible by integration (updateIssue)',
    },
    expect: 'GraphQL: Resource not accessible by integration (updateIssue)',
  },
  {
    description: 'the first line that holds words is kept, the rest dropped',
    given: {
      faultText:
        '\n  GraphQL: Resource not accessible by integration (repository.issues)\nsee https://docs.github.com/rest\n',
    },
    expect:
      'GraphQL: Resource not accessible by integration (repository.issues)',
  },
  {
    description:
      'an exec header (our own call, its command cut) yields to the upstream line after it',
    given: {
      faultText:
        'Command failed: \nGraphQL: Resource not accessible by integration (updateIssue)',
    },
    expect: 'GraphQL: Resource not accessible by integration (updateIssue)',
  },
  {
    description:
      'an exec header with naught after it is shown by the drain, never kept',
    given: { faultText: 'Command failed: ' },
    expect: null,
  },
  {
    description:
      'a request id with no words after it is never kept, so the file cannot churn',
    given: { faultText: 'x-github-request-id: 9F3A:1B2C:77D0' },
    expect: null,
  },
  {
    description:
      'a clock on a line not kept never reaches the file, so the words line stays',
    given: {
      faultText:
        'HTTP 403: refused\nx-github-request-id: 9F3A:1B2C at 2026-11-02T14:02:11Z',
    },
    expect: 'HTTP 403: refused',
  },
  {
    description: 'a clock in the kept line drops the headline whole',
    given: {
      faultText:
        'GraphQL: Resource not accessible by integration (updateIssue) at 2026-11-02T14:02:11Z',
    },
    expect: null,
  },
  {
    description: 'a bare clock with no zone drops it too, as the gate would',
    given: { faultText: 'refused at 14:02:11' },
    expect: null,
  },
  {
    description: 'an epoch on a skipped header line never reaches the file',
    given: {
      faultText: 'HTTP 403: refused\nx-ratelimit-reset: 1730557331',
    },
    expect: 'HTTP 403: refused',
  },
  {
    description:
      'an epoch in seconds in the kept line drops the headline whole',
    given: { faultText: 'HTTP 403: refused until 1730557331' },
    expect: null,
  },
  {
    description:
      'a 14-digit run the cut shortens into an epoch shape is dropped, never kept nor thrown',
    // 9 + 177 = 186 chars ahead of the run, so the cut at 199 keeps 13 of its 14 digits
    given: { faultText: `GraphQL: ${'d'.repeat(177)}12345678901234 tail` },
    expect: null,
  },
  {
    description: 'an epoch in milliseconds drops it too',
    given: { faultText: 'refused; retry after 1730557331000' },
    expect: null,
  },
  {
    description: 'a short number, such as an issue or status, is kept',
    given: { faultText: 'HTTP 404: Not Found (issue 673)' },
    expect: 'HTTP 404: Not Found (issue 673)',
  },
  {
    description:
      'two requests that differ only in their request id keep one headline',
    given: {
      faultText:
        'x-github-request-id: 9F3A:1B2C:77D0\nGraphQL: Resource not accessible by integration (updateIssue)',
    },
    expect: 'GraphQL: Resource not accessible by integration (updateIssue)',
  },
  {
    description: 'a classic token shape drops the headline whole',
    given: {
      faultText: `gh: Bad credentials for ghp_${'a'.repeat(36)}`,
    },
    expect: null,
  },
  {
    description: 'a fine-grained token shape drops the headline whole',
    given: { faultText: `refused github_pat_${'b'.repeat(40)}` },
    expect: null,
  },
  {
    description: 'a bearer header drops the headline whole',
    given: { faultText: `refused: Authorization: Bearer ${'c'.repeat(30)}` },
    expect: null,
  },
  {
    description: 'a line past the bound is cut to it, with an ellipsis',
    given: { faultText: `GraphQL: ${'d'.repeat(400)}` },
    expect: `GraphQL: ${'d'.repeat(190)}…`,
  },
  {
    description: 'text with no words keeps no headline',
    given: { faultText: '  \n\n ' },
    expect: null,
  },
];

describe('asRadioReasonHeadline', () => {
  CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the headline is taken', () => {
        then('it yields the expected line', () => {
          expect(
            asRadioReasonHeadline({
              reason: 'upstream:access',
              ...thisCase.given,
            }),
          ).toEqual(thisCase.expect);
        });
      });
    }),
  );

  given('[wall] a reason that halts the drain', () => {
    when('[t0] the headline is taken', () => {
      then('a rate limit keeps no words, since they vary per attempt', () => {
        expect(
          asRadioReasonHeadline({
            reason: 'upstream:rate-limit',
            faultText: 'API rate limit exceeded for installation ID 1',
          }),
        ).toEqual(null);
      });
      then('an outage keeps no words either', () => {
        expect(
          asRadioReasonHeadline({
            reason: 'upstream:transient',
            faultText: 'HTTP 502: Bad Gateway',
          }),
        ).toEqual(null);
      });
    });
  });
});
