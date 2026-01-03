import { BehaviorMeasuredGain } from '../../../../domain.objects/BehaviorMeasuredGain';
import type { BehaviorMeasuredGainLeverage } from '../../../../domain.objects/BehaviorMeasuredGainLeverage';
import type { BehaviorMeasuredGainYieldage } from '../../../../domain.objects/BehaviorMeasuredGainYieldage';

/**
 * .what = computes composite gain from leverage and yieldage (deterministic)
 * .why = gain(+$/wk) = leverage (time) + yieldage (cash) in dollars per week
 *
 * composite formula:
 *   gain = (leverage.direct + leverage.transitive) mins/wk ÷ 60 × hourlyRate
 *        + (yieldage.direct.expected + yieldage.transitive) $/wk
 *
 * @note leverage is in mins/wk, converted to $/wk via hourlyRate
 * @note yieldage is already in $/wk
 */
export const computeBehaviorMeasuredGainComposite = (input: {
  leverage: BehaviorMeasuredGainLeverage;
  yieldage: BehaviorMeasuredGainYieldage;
  config: {
    hourlyRate: number;
  };
}): BehaviorMeasuredGain => {
  // convert leverage (mins/wk) to $/wk via hourlyRate
  const leverageMinsPerWeek = input.leverage.direct + input.leverage.transitive;
  const leverageHoursPerWeek = leverageMinsPerWeek / 60;
  const leverageDollarsPerWeek = leverageHoursPerWeek * input.config.hourlyRate;

  // yieldage is already in $/wk
  const yieldageDollarsPerWeek =
    input.yieldage.direct.expected + input.yieldage.transitive;

  // composite = leverage in $/wk + yieldage in $/wk
  const composite = leverageDollarsPerWeek + yieldageDollarsPerWeek;

  return new BehaviorMeasuredGain({
    dimensions: {
      leverage: input.leverage,
      yieldage: input.yieldage,
    },
    composite,
  });
};
