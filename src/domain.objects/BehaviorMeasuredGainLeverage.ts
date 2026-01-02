import { DomainLiteral } from 'domain-objects';

/**
 * .what = leverage dimension of gain measurement
 * .why = captures time savings from behavior completion (direct + transitive)
 */
export interface BehaviorMeasuredGainLeverage {
  direct: number;
  transitive: number;
}

export class BehaviorMeasuredGainLeverage
  extends DomainLiteral<BehaviorMeasuredGainLeverage>
  implements BehaviorMeasuredGainLeverage {}
