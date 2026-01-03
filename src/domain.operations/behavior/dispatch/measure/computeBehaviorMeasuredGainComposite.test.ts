import { given, then, when } from 'test-fns';

import { BehaviorMeasuredGainLeverage } from '../../../../domain.objects/BehaviorMeasuredGainLeverage';
import { BehaviorMeasuredGainYieldage } from '../../../../domain.objects/BehaviorMeasuredGainYieldage';
import { BehaviorMeasuredGainYieldageChance } from '../../../../domain.objects/BehaviorMeasuredGainYieldageChance';
import { computeBehaviorMeasuredGainComposite } from './computeBehaviorMeasuredGainComposite';

describe('computeBehaviorMeasuredGainComposite', () => {
  given('[case1] leverage and yieldage inputs', () => {
    when('[t0] computing composite gain', () => {
      then('combines leverage (time) and yieldage (cash) into $/wk', () => {
        const leverage = new BehaviorMeasuredGainLeverage({
          direct: 60, // 1 hour/wk saved
          transitive: 30, // 0.5 hour/wk from unblocking
        });

        const yieldage = new BehaviorMeasuredGainYieldage({
          direct: {
            chances: [
              new BehaviorMeasuredGainYieldageChance({
                yieldage: 100,
                probability: 1.0,
              }),
            ],
            expected: 100, // $100/wk
          },
          transitive: 50, // $50/wk from unblocking
        });

        const result = computeBehaviorMeasuredGainComposite({
          leverage,
          yieldage,
          config: { hourlyRate: 100 },
        });

        // leverage: (60 + 30) mins/wk ÷ 60 × $100 = $150/wk
        // yieldage: ($100 + $50) = $150/wk
        // composite: $300/wk
        expect(result.composite).toEqual(300);
        expect(result.dimensions.leverage).toEqual(leverage);
        expect(result.dimensions.yieldage).toEqual(yieldage);
      });
    });

    when('[t1] leverage is zero', () => {
      then('composite equals yieldage only', () => {
        const leverage = new BehaviorMeasuredGainLeverage({
          direct: 0,
          transitive: 0,
        });

        const yieldage = new BehaviorMeasuredGainYieldage({
          direct: {
            chances: [
              new BehaviorMeasuredGainYieldageChance({
                yieldage: 200,
                probability: 1.0,
              }),
            ],
            expected: 200,
          },
          transitive: 0,
        });

        const result = computeBehaviorMeasuredGainComposite({
          leverage,
          yieldage,
          config: { hourlyRate: 100 },
        });

        expect(result.composite).toEqual(200);
      });
    });

    when('[t2] yieldage is zero', () => {
      then('composite equals leverage only', () => {
        const leverage = new BehaviorMeasuredGainLeverage({
          direct: 120, // 2 hours/wk
          transitive: 0,
        });

        const yieldage = new BehaviorMeasuredGainYieldage({
          direct: {
            chances: [],
            expected: 0,
          },
          transitive: 0,
        });

        const result = computeBehaviorMeasuredGainComposite({
          leverage,
          yieldage,
          config: { hourlyRate: 100 },
        });

        // leverage: 120 mins/wk ÷ 60 × $100 = $200/wk
        expect(result.composite).toEqual(200);
      });
    });

    when('[t3] transitive contributions are significant', () => {
      then('includes both direct and transitive in composite', () => {
        const leverage = new BehaviorMeasuredGainLeverage({
          direct: 30,
          transitive: 90, // 3x the direct
        });

        const yieldage = new BehaviorMeasuredGainYieldage({
          direct: {
            chances: [
              new BehaviorMeasuredGainYieldageChance({
                yieldage: 50,
                probability: 1.0,
              }),
            ],
            expected: 50,
          },
          transitive: 150, // 3x the direct
        });

        const result = computeBehaviorMeasuredGainComposite({
          leverage,
          yieldage,
          config: { hourlyRate: 100 },
        });

        // leverage: (30 + 90) mins/wk ÷ 60 × $100 = $200/wk
        // yieldage: ($50 + $150) = $200/wk
        // composite: $400/wk
        expect(result.composite).toEqual(400);
      });
    });
  });
});
