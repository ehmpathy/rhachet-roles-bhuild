import { DomainLiteral } from 'domain-objects';

/**
 * .what = expend dimension of cost measurement
 * .why = captures cash investment required, distinguishing upfront vs recurrent
 *
 * formula: composite = (upfront ÷ cost.horizon) + recurrent
 * - upfront: one-time cash cost ($$), amortized over cost.horizon
 * - recurrent: ongoing cash cost ($$/wk)
 * - composite: total cash cost per week ($$/wk)
 */
export interface BehaviorMeasuredCostExpend {
  /**
   * upfront cash cost (one-time, amortized over cost.horizon)
   * @unit $$
   */
  upfront: number;

  /**
   * recurrent cash cost (per week)
   * @unit $$/wk
   */
  recurrent: number;

  /**
   * composite cash cost = (upfront ÷ cost.horizon) + recurrent
   * @unit $$/wk
   */
  composite: number;
}

export class BehaviorMeasuredCostExpend
  extends DomainLiteral<BehaviorMeasuredCostExpend>
  implements BehaviorMeasuredCostExpend {}
