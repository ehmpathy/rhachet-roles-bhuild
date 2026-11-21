import { given, then, when } from 'test-fns';

import { asRadioLineWithoutClassHeader } from './asRadioLineWithoutClassHeader';

const TEST_CASES = [
  {
    description: 'a constraint header is cut',
    given: {
      line: '✋ ConstraintError: --auth as-robot:env(TOKEN) specified but TOKEN is not set',
    },
    expect: {
      output: '--auth as-robot:env(TOKEN) specified but TOKEN is not set',
    },
  },
  {
    description: 'a malfunction header is cut',
    given: { line: '💥 MalfunctionError: gh timed out' },
    expect: { output: 'gh timed out' },
  },
  {
    description:
      'a line with no glyph is kept whole, so a gh error that names a class reads verbatim',
    given: { line: 'HttpError: Bad credentials' },
    expect: { output: 'HttpError: Bad credentials' },
  },
];

describe('asRadioLineWithoutClassHeader', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the line is read', () => {
        then('it yields the expected line', () => {
          expect(asRadioLineWithoutClassHeader(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
