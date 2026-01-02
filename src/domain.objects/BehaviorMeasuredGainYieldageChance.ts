import { DomainLiteral } from 'domain-objects';

/**
 * .what = a probabilistic value outcome
 * .why = captures uncertainty in value realization via probability weighting
 */
export interface BehaviorMeasuredGainYieldageChance {
  yieldage: number;
  probability: number;
}

export class BehaviorMeasuredGainYieldageChance
  extends DomainLiteral<BehaviorMeasuredGainYieldageChance>
  implements BehaviorMeasuredGainYieldageChance {}
