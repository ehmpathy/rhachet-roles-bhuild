import { ConstraintError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { asGhIssueNumber } from './asGhIssueNumber';

const ACCEPT_CASES = [
  { description: 'a plain issue number', given: { exid: '599' } },
  { description: 'a one-digit issue number', given: { exid: '7' } },
];

const REFUSE_CASES = [
  {
    description: 'a hash-prefixed number, as a human types it',
    given: { exid: '#599' },
  },
  { description: 'a zero up front', given: { exid: '0599' } },
  { description: 'zero', given: { exid: '0' } },
  { description: 'an os.fileops exid shape', given: { exid: 'test-006' } },
  { description: 'a flag-shaped value', given: { exid: '--repo' } },
  { description: 'empty', given: { exid: '' } },
];

describe('asGhIssueNumber', () => {
  ACCEPT_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] it is checked', () => {
        then('it returns the exid unchanged', () => {
          expect(asGhIssueNumber(thisCase.given)).toEqual(thisCase.given.exid);
        });
      });
    }),
  );

  REFUSE_CASES.map((thisCase, index) =>
    given(
      `[case${ACCEPT_CASES.length + index + 1}] ${thisCase.description}`,
      () => {
        when('[t0] it is checked', () => {
          then(
            'it refuses as a constraint that names the exid and the fix',
            async () => {
              const error = await getError(() =>
                asGhIssueNumber(thisCase.given),
              );
              expect(error).toBeInstanceOf(ConstraintError);
              expect(error.message).toContain(`exid "${thisCase.given.exid}"`);
              expect(error.message).toContain(
                "is the issue's number, e.g. 599",
              );
              expect(error.message).not.toContain('{');
              expect(error.message).toMatchSnapshot();
            },
          );
        });
      },
    ),
  );
});
