import { DomainLiteral } from 'domain-objects';

import type { BehaviorMeasuredGainLeverage } from './BehaviorMeasuredGainLeverage';
import type { BehaviorMeasuredGainYieldage } from './BehaviorMeasuredGainYieldage';

/**
 * .what = composite gain measurement
 * .why = combines leverage (time) and yieldage (cash) into absolute value (+$)
 */
export interface BehaviorMeasuredGain {
  dimensions: {
    leverage: BehaviorMeasuredGainLeverage;
    yieldage: BehaviorMeasuredGainYieldage;
  };
  composite: number;
}

export class BehaviorMeasuredGain
  extends DomainLiteral<BehaviorMeasuredGain>
  implements BehaviorMeasuredGain
{
  public static nested = {
    dimensions: DomainLiteral,
  };
}
