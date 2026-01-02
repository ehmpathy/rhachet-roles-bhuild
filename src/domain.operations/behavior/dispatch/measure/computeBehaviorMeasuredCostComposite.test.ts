import { given, then, when } from 'test-fns';

import { BehaviorMeasuredCostAttend } from '../../../../domain.objects/BehaviorMeasuredCostAttend';
import { BehaviorMeasuredCostExpend } from '../../../../domain.objects/BehaviorMeasuredCostExpend';
import { computeBehaviorMeasuredCostComposite } from './computeBehaviorMeasuredCostComposite';

describe('computeBehaviorMeasuredCostComposite', () => {
  given('[case1] attend and expend inputs', () => {
    when('[t0] computing composite cost', () => {
      then('combines attend (time) and expend (cash) into $/wk', () => {
        const attend = new BehaviorMeasuredCostAttend({
          upfront: 480, // 8 hours
          recurrent: 60, // 1 hour/wk
          composite: 60, // already computed as mins/wk
        });

        const expend = new BehaviorMeasuredCostExpend({
          upfront: 1000,
          recurrent: 50,
          composite: 50, // already in $/wk
        });

        const result = computeBehaviorMeasuredCostComposite({
          attend,
          expend,
          config: { hourlyRate: 100 },
        });

        // attend: 60 mins/wk ÷ 60 × $100 = $100/wk
        // expend: $50/wk
        // composite: $150/wk
        expect(result.composite).toEqual(150);
        expect(result.dimensions.attend).toEqual(attend);
        expect(result.dimensions.expend).toEqual(expend);
      });
    });

    when('[t1] attend is zero', () => {
      then('composite equals expend only', () => {
        const attend = new BehaviorMeasuredCostAttend({
          upfront: 0,
          recurrent: 0,
          composite: 0,
        });

        const expend = new BehaviorMeasuredCostExpend({
          upfront: 500,
          recurrent: 25,
          composite: 25,
        });

        const result = computeBehaviorMeasuredCostComposite({
          attend,
          expend,
          config: { hourlyRate: 100 },
        });

        expect(result.composite).toEqual(25);
      });
    });

    when('[t2] expend is zero', () => {
      then('composite equals attend only', () => {
        const attend = new BehaviorMeasuredCostAttend({
          upfront: 240,
          recurrent: 30,
          composite: 30, // 30 mins/wk
        });

        const expend = new BehaviorMeasuredCostExpend({
          upfront: 0,
          recurrent: 0,
          composite: 0,
        });

        const result = computeBehaviorMeasuredCostComposite({
          attend,
          expend,
          config: { hourlyRate: 100 },
        });

        // attend: 30 mins/wk ÷ 60 × $100 = $50/wk
        expect(result.composite).toEqual(50);
      });
    });

    when('[t3] different hourly rates', () => {
      then('scales attend appropriately', () => {
        const attend = new BehaviorMeasuredCostAttend({
          upfront: 0,
          recurrent: 0,
          composite: 60, // 1 hour/wk
        });

        const expend = new BehaviorMeasuredCostExpend({
          upfront: 0,
          recurrent: 0,
          composite: 0,
        });

        const resultLow = computeBehaviorMeasuredCostComposite({
          attend,
          expend,
          config: { hourlyRate: 50 },
        });

        const resultHigh = computeBehaviorMeasuredCostComposite({
          attend,
          expend,
          config: { hourlyRate: 200 },
        });

        expect(resultLow.composite).toEqual(50);
        expect(resultHigh.composite).toEqual(200);
      });
    });
  });
});
