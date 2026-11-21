import { given, then, when } from 'test-fns';

import { isRadioPromiseHoldReason } from './isRadioPromiseHoldReason';

const TEST_CASES = [
  { reason: 'public-repo:unpromised', expect: true },
  { reason: 'public-repo:unreadable', expect: true },
  { reason: 'public-repo:unreadable-auth', expect: true },
  { reason: 'upstream:auth', expect: false },
  { reason: 'upstream:401', expect: false },
  { reason: null, expect: false },
  { reason: 'dropped: public-repo:unpromised', expect: false },
  { reason: 'public-repo', expect: false },
];

describe('isRadioPromiseHoldReason', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] reason ${String(thisCase.reason)}`, () => {
      when('[t0] the reason is checked', () => {
        then(`it reads ${thisCase.expect}`, () => {
          expect(isRadioPromiseHoldReason(thisCase.reason)).toEqual(
            thisCase.expect,
          );
        });
      });
    }),
  );
});
