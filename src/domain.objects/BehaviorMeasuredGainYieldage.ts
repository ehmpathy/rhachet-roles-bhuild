import { DomainLiteral } from 'domain-objects';

import type { BehaviorMeasuredGainYieldageChance } from './BehaviorMeasuredGainYieldageChance';

/**
 * .what = yieldage dimension of gain measurement
 * .why = captures probabilistic cash returns from behavior completion
 */
export interface BehaviorMeasuredGainYieldage {
  direct: {
    chances: BehaviorMeasuredGainYieldageChance[];
    expected: number;
  };
  transitive: number;
}

export class BehaviorMeasuredGainYieldage
  extends DomainLiteral<BehaviorMeasuredGainYieldage>
  implements BehaviorMeasuredGainYieldage
{
  public static nested = {
    direct: DomainLiteral,
  };
}
