import {
  BadRequestError,
  ConstraintError,
  UnexpectedCodePathError,
} from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { isRadioReplayRefusal } from './isRadioReplayRefusal';

const REFUSAL_CASES = [
  {
    description: 'a stale transition is a refusal',
    given: {
      error: new BadRequestError('task already claimed by different branch'),
    },
    expect: { output: true },
  },
  {
    description: 'a rejected token is a fault, not a refusal',
    given: { error: new ConstraintError('github auth failed') },
    expect: { output: false },
  },
  {
    description: 'a malfunction is a fault, not a refusal',
    given: {
      error: new UnexpectedCodePathError('failed to parse issue number'),
    },
    expect: { output: false },
  },
  {
    description: 'a plain error is a fault, not a refusal',
    given: { error: new Error('Command failed: gh issue create') },
    expect: { output: false },
  },
];

describe('isRadioReplayRefusal', () => {
  REFUSAL_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the replay error is checked', () => {
        then('it yields the expected verdict', () => {
          expect(isRadioReplayRefusal(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
