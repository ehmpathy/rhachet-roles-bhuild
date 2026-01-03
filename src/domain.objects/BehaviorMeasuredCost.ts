import { DomainLiteral } from 'domain-objects';

import type { BehaviorMeasuredCostAttend } from './BehaviorMeasuredCostAttend';
import type { BehaviorMeasuredCostExpend } from './BehaviorMeasuredCostExpend';

/**
 * .what = composite cost measurement
 * .why = combines attend (time) and expend (cash) into absolute cost (-$)
 */
export interface BehaviorMeasuredCost {
  dimensions: {
    attend: BehaviorMeasuredCostAttend;
    expend: BehaviorMeasuredCostExpend;
  };
  composite: number;
}

export class BehaviorMeasuredCost
  extends DomainLiteral<BehaviorMeasuredCost>
  implements BehaviorMeasuredCost
{
  public static nested = {
    dimensions: DomainLiteral,
  };
}
