import { given, then, when } from 'test-fns';

import { asRadioErrorTextSansClass } from './asRadioErrorTextSansClass';

const TEST_CASES = [
  {
    description: 'a ConstraintError header is cut',
    given: {
      line: '✋ ConstraintError: github auth failed: the bot token was absent',
    },
    expect: { output: 'github auth failed: the bot token was absent' },
  },
  {
    description: 'a MalfunctionError header is cut',
    given: { line: '💥 MalfunctionError: HTTP 502: Bad Gateway' },
    expect: { output: 'HTTP 502: Bad Gateway' },
  },
  {
    description: 'a bare class header with no glyph is cut',
    given: { line: 'ConstraintError: no --spot supplied' },
    expect: { output: 'no --spot supplied' },
  },
  {
    description: 'upstream words with a colon are kept whole',
    given: {
      line: 'GraphQL: Resource not accessible by integration (updateIssue)',
    },
    expect: {
      output: 'GraphQL: Resource not accessible by integration (updateIssue)',
    },
  },
  {
    description: 'a line with no header is kept whole',
    given: { line: 'API rate limit exceeded' },
    expect: { output: 'API rate limit exceeded' },
  },
];

describe('asRadioErrorTextSansClass', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the line is read', () => {
        then('it yields the expected text', () => {
          expect(asRadioErrorTextSansClass(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
