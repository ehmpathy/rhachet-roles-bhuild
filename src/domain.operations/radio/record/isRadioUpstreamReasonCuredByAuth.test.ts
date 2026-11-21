import { given, then, when } from 'test-fns';

import { isRadioUpstreamReasonCuredByAuth } from './isRadioUpstreamReasonCuredByAuth';

const TEST_CASES = [
  { reason: 'upstream:access', expect: true },
  { reason: 'upstream:not-found', expect: true },
  { reason: 'upstream:401', expect: true },
  { reason: 'upstream:auth', expect: true },
  { reason: 'upstream:rate-limit', expect: false },
  { reason: 'upstream:transient', expect: false },
  { reason: 'public-repo:unpromised', expect: false },
  { reason: 'radio.uses:blocked — org', expect: false },
  { reason: null, expect: false },
];

describe('isRadioUpstreamReasonCuredByAuth', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] reason ${thisCase.reason ?? 'none'}`, () => {
      when('[t0] the cure is asked', () => {
        then(`an auth amend cures it: ${thisCase.expect}`, () => {
          expect(
            isRadioUpstreamReasonCuredByAuth({ reason: thisCase.reason }),
          ).toEqual(thisCase.expect);
        });
      });
    }),
  );
});
