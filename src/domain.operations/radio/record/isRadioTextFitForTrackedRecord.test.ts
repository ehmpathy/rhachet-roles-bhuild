import { given, then, when } from 'test-fns';

import { isRadioTextFitForTrackedRecord } from './isRadioTextFitForTrackedRecord';

/**
 * .what = a fake credential of the given prefix, built at run time
 * .why = a literal token shape in a tracked file would trip a secret scan; this one never exists
 */
const genFakeToken = (input: { prefix: string }): string =>
  `${input.prefix}${'a'.repeat(36)}`;

/**
 * .what = texts, each with whether it may be kept on a tracked record file
 * .why = the one chokepoint that keeps a clock, an epoch, or a token off a tracked record; each
 *        shape it refuses is named here, directly, not only through a caller
 */
const TEST_CASES = [
  {
    description: 'a plain github refusal is fit',
    text: 'GraphQL: Resource not accessible by integration (updateIssue)',
    expected: true,
  },
  {
    description: 'a short number (an issue, a status) is fit',
    text: 'HTTP 422: Validation Failed for issue 599',
    expected: true,
  },
  {
    description: 'a clock with a zone is not fit',
    text: 'refused at 2026-11-02T14:02:11Z',
    expected: false,
  },
  {
    description:
      'a bare clock with no date and no zone is not fit, as the gate reads it',
    text: 'refused at 14:02:11',
    expected: false,
  },
  {
    description: 'an epoch in seconds is not fit',
    text: 'x-ratelimit-reset: 1730557331',
    expected: false,
  },
  {
    description: 'an epoch in milliseconds is not fit',
    text: 'retry after 1730557331000',
    expected: false,
  },
  {
    description: 'a classic github token is not fit',
    text: `token ${genFakeToken({ prefix: 'ghp_' })} was rejected`,
    expected: false,
  },
  {
    description: 'an installation token is not fit',
    text: `auth ${genFakeToken({ prefix: 'ghs_' })}`,
    expected: false,
  },
  {
    description: 'a fine-grained token is not fit',
    text: `auth ${genFakeToken({ prefix: 'github_pat_' })}`,
    expected: false,
  },
  {
    description: 'a bearer header is not fit',
    text: `Authorization: Bearer ${'b'.repeat(40)}`,
    expected: false,
  },
];

describe('isRadioTextFitForTrackedRecord', () => {
  TEST_CASES.map((thisCase) =>
    given(`a text: ${thisCase.description}`, () => {
      when('[t0] it is asked whether the text may be kept', () => {
        then(`it answers ${thisCase.expected}`, () => {
          expect(
            isRadioTextFitForTrackedRecord({ text: thisCase.text }),
          ).toEqual(thisCase.expected);
        });
      });
    }),
  );
});
