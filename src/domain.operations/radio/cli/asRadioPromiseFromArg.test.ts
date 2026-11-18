import { ConstraintError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { asRadioPromiseFromArg } from './asRadioPromiseFromArg';

const LITERAL = 'task-to-public-repo-is-anonymized';

const ACCEPT_CASES = [
  { description: 'the literal', given: { raw: LITERAL }, expect: LITERAL },
  { description: 'an absent flag', given: { raw: null }, expect: null },
];

const REFUSE_CASES = [
  { description: 'another value', given: { raw: 'yes' }, shown: `'yes'` },
  { description: 'a bare flag', given: { raw: true }, shown: '(no value)' },
  { description: 'an empty value', given: { raw: '' }, shown: `''` },
  {
    description: 'the literal with whitespace around it',
    given: { raw: ` ${LITERAL} ` },
    shown: `' ${LITERAL} '`,
  },
];

describe('asRadioPromiseFromArg', () => {
  ACCEPT_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the flag is read', () => {
        then('it returns the promise, or null', () => {
          expect(asRadioPromiseFromArg(thisCase.given)).toEqual(
            thisCase.expect,
          );
        });
      });
    }),
  );
  REFUSE_CASES.map((thisCase, index) =>
    given(
      `[case${ACCEPT_CASES.length + index + 1}] ${thisCase.description}`,
      () => {
        when('[t0] the flag is read', () => {
          then(
            'it refuses with the value and the one valid value',
            async () => {
              const error = await getError(() =>
                asRadioPromiseFromArg(thisCase.given),
              );
              expect(error).toBeInstanceOf(ConstraintError);
              expect(error.message).toContain(`--promise ${thisCase.shown}`);
              expect(error.message).toContain(`--promise ${LITERAL}`);
            },
          );
        });
      },
    ),
  );
});
