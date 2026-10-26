import { given, then, when } from 'test-fns';

import { isRadioUpstreamReasonHalt } from './isRadioUpstreamReasonHalt';

const HALT_CASES = [
  { reason: 'upstream:rate-limit', halt: true },
  { reason: 'upstream:transient', halt: true },
  { reason: 'upstream:401', halt: false },
  { reason: 'upstream:access', halt: false },
  { reason: 'upstream:not-found', halt: false },
  { reason: 'upstream:fault', halt: false },
  { reason: 'upstream:auth', halt: false },
];

describe('isRadioUpstreamReasonHalt', () => {
  HALT_CASES.map((thisCase, index) =>
    given(
      `[case${index + 1}] ${thisCase.reason} ${thisCase.halt ? 'halts the drain' : 'sets one record aside'}`,
      () => {
        when('[t0] the halt rule is checked', () => {
          then('it yields the expected verdict', () => {
            expect(
              isRadioUpstreamReasonHalt({ reason: thisCase.reason }),
            ).toEqual(thisCase.halt);
          });
        });
      },
    ),
  );
});
