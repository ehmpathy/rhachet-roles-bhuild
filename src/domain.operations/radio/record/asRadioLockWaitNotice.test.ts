import { given, then, when } from 'test-fns';

import { asRadioLockWaitNotice } from './asRadioLockWaitNotice';

describe('asRadioLockWaitNotice', () => {
  given('[case1] a caller blocked on the radio lock', () => {
    when('[t0] the notice renders', () => {
      const notice = asRadioLockWaitNotice();

      then('it says the caller waits, why, and for how long at most', () => {
        expect(notice).toContain('waits for the radio lock');
        expect(notice).toContain('another drain holds it');
        expect(notice).toContain('up to 2 min');
        expect(notice).toMatchSnapshot();
      });
    });
  });
});
