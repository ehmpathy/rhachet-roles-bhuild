import { given, then, when } from 'test-fns';

import { asRadioAuthBothFailedError } from '@src/domain.operations/radio/auth/asRadioAuthBothFailedError';

import { isRadioAuthBothFailedDetail } from './isRadioAuthBothFailedDetail';

const TEST_CASES = [
  {
    description: 'the both-failed fault tree is detected',
    given: {
      detail: asRadioAuthBothFailedError({
        bot: { reason: 'absent', headline: 'h', fix: 'f' },
        ambient: { state: 'absent' },
      }).message,
    },
    expect: { output: true },
  },
  {
    description: 'a drain row, cut to the headline, is not',
    given: {
      detail:
        'github auth failed: the ehmpath bot token was absent, and no ambient credential was found',
    },
    expect: { output: false },
  },
  {
    description: 'any other fault is not',
    given: { detail: 'the repo could not be seen' },
    expect: { output: false },
  },
  {
    description: 'no detail is not',
    given: { detail: null },
    expect: { output: false },
  },
];

describe('isRadioAuthBothFailedDetail', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the detail is checked', () => {
        then('it yields the expected verdict', () => {
          expect(isRadioAuthBothFailedDetail(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
