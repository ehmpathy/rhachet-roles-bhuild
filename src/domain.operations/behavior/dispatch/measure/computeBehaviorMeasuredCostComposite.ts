import { BehaviorMeasuredCost } from '../../../../domain.objects/BehaviorMeasuredCost';
import type { BehaviorMeasuredCostAttend } from '../../../../domain.objects/BehaviorMeasuredCostAttend';
import type { BehaviorMeasuredCostExpend } from '../../../../domain.objects/BehaviorMeasuredCostExpend';

/**
 * .what = computes composite cost from attend and expend (deterministic)
 * .why = cost(-$/wk) = attend (time) + expend (cash) in dollars per week
 *
 * composite formula:
 *   cost = (attend.composite mins/wk ÷ 60 × hourlyRate) + expend.composite $/wk
 *
 * @note attend.composite is in mins/wk, converted to $/wk via hourlyRate
 * @note expend.composite is already in $/wk
 */
export const computeBehaviorMeasuredCostComposite = (input: {
  attend: BehaviorMeasuredCostAttend;
  expend: BehaviorMeasuredCostExpend;
  config: {
    hourlyRate: number;
  };
}): BehaviorMeasuredCost => {
  // convert attend (mins/wk) to $/wk via hourlyRate
  const attendHoursPerWeek = input.attend.composite / 60;
  const attendDollarsPerWeek = attendHoursPerWeek * input.config.hourlyRate;

  // expend.composite is already in $/wk
  const expendDollarsPerWeek = input.expend.composite;

  // composite = attend in $/wk + expend in $/wk
  const composite = attendDollarsPerWeek + expendDollarsPerWeek;

  return new BehaviorMeasuredCost({
    dimensions: {
      attend: input.attend,
      expend: input.expend,
    },
    composite,
  });
};
