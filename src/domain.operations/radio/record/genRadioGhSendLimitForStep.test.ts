import { given, then, when } from 'test-fns';

import { genRadioGhSendLimitForStep } from './genRadioGhSendLimitForStep';

const SEND_LIMIT = {
  perCall: { milliseconds: 5_000 },
  perSend: { milliseconds: 10_000 },
};

describe('genRadioGhSendLimitForStep', () => {
  given('[case1] a drain with more time left than the step cap', () => {
    when('[t0] the step limit is made', () => {
      then('the step keeps its own cap', () => {
        const limit = genRadioGhSendLimitForStep({
          sendLimit: SEND_LIMIT,
          deadline: { getMillisecondsLeft: () => 60_000 },
        });
        expect(limit.perCall).toEqual({ milliseconds: 5_000 });
        expect(limit.getMillisecondsLeft()).toBeGreaterThan(9_000);
        expect(limit.getMillisecondsLeft()).toBeLessThanOrEqual(10_000);
      });
    });
  });

  given('[case2] a drain with less time left than the step cap', () => {
    when('[t0] the step limit is made', () => {
      then(
        'the step is cut to what the drain has left, so it ends inside the lease',
        () => {
          const limit = genRadioGhSendLimitForStep({
            sendLimit: SEND_LIMIT,
            deadline: { getMillisecondsLeft: () => 2_000 },
          });
          expect(limit.getMillisecondsLeft()).toBeLessThanOrEqual(2_000);
        },
      );
    });
  });

  given('[case3] a drain past its deadline', () => {
    when('[t0] the step limit is made', () => {
      then('the step has no time, never a negative bound', () => {
        const limit = genRadioGhSendLimitForStep({
          sendLimit: undefined,
          deadline: { getMillisecondsLeft: () => -500 },
        });
        expect(limit.getMillisecondsLeft()).toBeLessThanOrEqual(0);
        expect(limit.getMillisecondsLeft()).toBeGreaterThan(-1_000);
      });
    });
  });
});
