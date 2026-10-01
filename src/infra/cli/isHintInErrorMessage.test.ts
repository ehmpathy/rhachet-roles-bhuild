import { BadRequestError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { isHintInErrorMessage } from './isHintInErrorMessage';

const hintMultiLine = 'ask your human to grant:\n  $ rhx radio.uses allow';

const TEST_CASES = [
  {
    description:
      'a multi-line hint that helpful-errors embedded as json is found (the double-hint defect)',
    given: {
      message: new BadRequestError('radio.task.push blocked', {
        hint: hintMultiLine,
      }).message,
      hint: hintMultiLine,
    },
    expect: { output: true },
  },
  {
    description: 'a one-line hint embedded in the message is found',
    given: {
      message: new BadRequestError('--via is required', {
        hint: 'specify a channel',
      }).message,
      hint: 'specify a channel',
    },
    expect: { output: true },
  },
  {
    description: 'a hint absent from the message is not found',
    given: { message: 'radio.task.push blocked', hint: hintMultiLine },
    expect: { output: false },
  },
];

describe('isHintInErrorMessage', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the error message is checked for its hint', () => {
        then('it yields the expected verdict', () => {
          expect(isHintInErrorMessage(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
