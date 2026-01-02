import { given, then, when } from 'test-fns';

import { assignBehaviorMeasuredPriority } from './assignBehaviorMeasuredPriority';

describe('assignBehaviorMeasuredPriority', () => {
  given('[case1] default thresholds', () => {
    when('[t0] effect >= $10,000', () => {
      then('returns p0 (critical)', () => {
        const result = assignBehaviorMeasuredPriority({ effect: 10000 });
        expect(result).toEqual('p0');
      });
    });

    when('[t1] effect >= $2,000 but < $10,000', () => {
      then('returns p1 (high)', () => {
        const result = assignBehaviorMeasuredPriority({ effect: 5000 });
        expect(result).toEqual('p1');
      });
    });

    when('[t2] effect >= $500 but < $2,000', () => {
      then('returns p3 (medium)', () => {
        const result = assignBehaviorMeasuredPriority({ effect: 1000 });
        expect(result).toEqual('p3');
      });
    });

    when('[t3] effect < $500', () => {
      then('returns p5 (low)', () => {
        const result = assignBehaviorMeasuredPriority({ effect: 100 });
        expect(result).toEqual('p5');
      });
    });

    when('[t4] effect is exactly at threshold boundary', () => {
      then('returns higher priority level', () => {
        expect(assignBehaviorMeasuredPriority({ effect: 10000 })).toEqual('p0');
        expect(assignBehaviorMeasuredPriority({ effect: 2000 })).toEqual('p1');
        expect(assignBehaviorMeasuredPriority({ effect: 500 })).toEqual('p3');
      });
    });

    when('[t5] effect is negative', () => {
      then('returns p5 (low)', () => {
        const result = assignBehaviorMeasuredPriority({ effect: -100 });
        expect(result).toEqual('p5');
      });
    });
  });

  given('[case2] custom thresholds', () => {
    when('[t0] custom thresholds provided', () => {
      then('uses custom thresholds', () => {
        const customThresholds = {
          p0: 50000,
          p1: 10000,
          p3: 1000,
        };

        expect(
          assignBehaviorMeasuredPriority({
            effect: 60000,
            config: { thresholds: customThresholds },
          }),
        ).toEqual('p0');

        expect(
          assignBehaviorMeasuredPriority({
            effect: 20000,
            config: { thresholds: customThresholds },
          }),
        ).toEqual('p1');

        expect(
          assignBehaviorMeasuredPriority({
            effect: 5000,
            config: { thresholds: customThresholds },
          }),
        ).toEqual('p3');

        expect(
          assignBehaviorMeasuredPriority({
            effect: 500,
            config: { thresholds: customThresholds },
          }),
        ).toEqual('p5');
      });
    });
  });
});
