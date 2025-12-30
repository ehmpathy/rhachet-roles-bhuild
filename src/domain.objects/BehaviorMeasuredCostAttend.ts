import { DomainLiteral } from 'domain-objects';

/**
 * .what = attend dimension of cost measurement
 * .why = captures time investment required, distinguishing upfront vs recurrent
 *
 * formula: composite = (upfront ÷ cost.horizon) + recurrent
 * - upfront: one-time time cost (mins), amortized over cost.horizon
 * - recurrent: ongoing time cost (mins/wk)
 * - composite: total time cost per week (mins/wk)
 */
export interface BehaviorMeasuredCostAttend {
  /**
   * upfront time cost (one-time, amortized over cost.horizon)
   * @unit mins
   */
  upfront: number;

  /**
   * recurrent time cost (per week)
   * @unit mins/wk
   */
  recurrent: number;

  /**
   * composite time cost = (upfront ÷ cost.horizon) + recurrent
   * @unit mins/wk
   */
  composite: number;
}

export class BehaviorMeasuredCostAttend
  extends DomainLiteral<BehaviorMeasuredCostAttend>
  implements BehaviorMeasuredCostAttend {}
