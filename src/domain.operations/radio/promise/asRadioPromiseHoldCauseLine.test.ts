import { given, then, when } from 'test-fns';

import { asRadioPromiseHoldCauseLine } from './asRadioPromiseHoldCauseLine';
import { asRadioPromiseHoldDetail } from './asRadioPromiseHoldDetail';

describe('asRadioPromiseHoldCauseLine', () => {
  given('[case1] a detail with a cause, as the hold detail writes it', () => {
    const detail = asRadioPromiseHoldDetail({
      reason: 'public-repo:unreadable-auth',
      cause:
        '✋ ConstraintError: github auth failed: the robot token was rejected by github (401)',
    });

    when('[t0] the cause line is read', () => {
      then('it is the second line, its error class header cut off', () => {
        expect(asRadioPromiseHoldCauseLine({ detail })).toEqual(
          'cause: github auth failed: the robot token was rejected by github (401)',
        );
      });

      then('the claim line holds no parens', () => {
        expect(detail.split('\n')[0]).toEqual(
          'visibility unreadable on this auth — try as-human',
        );
      });
    });
  });

  given('[case2] a detail with no cause', () => {
    when('[t0] the cause line is read', () => {
      then('it is null', () => {
        const detail = asRadioPromiseHoldDetail({
          reason: 'public-repo:unreadable',
          cause: null,
        });
        expect(asRadioPromiseHoldCauseLine({ detail })).toBeNull();
      });
    });
  });

  given('[case3] no detail at all', () => {
    when('[t0] the cause line is read', () => {
      then('it is null', () => {
        expect(asRadioPromiseHoldCauseLine({ detail: null })).toBeNull();
      });
    });
  });
});
