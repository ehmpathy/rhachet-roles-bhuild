import { DomainEntity, type RefByUnique } from 'domain-objects';

import type { BehaviorGathered } from './BehaviorGathered';
import type { BehaviorMeasuredCost } from './BehaviorMeasuredCost';
import type { BehaviorMeasuredGain } from './BehaviorMeasuredGain';

/**
 * .what = represents a behavior with gain/cost/effect measurements
 * .why = enables prioritization by effect = gain - cost
 */

export type BehaviorMeasuredPriorityLevel = 'p0' | 'p1' | 'p3' | 'p5';

export interface BehaviorMeasured {
  measuredAt: string;
  gathered: RefByUnique<typeof BehaviorGathered>;
  gain: BehaviorMeasuredGain;
  cost: BehaviorMeasuredCost;
  effect: number;
  priority: BehaviorMeasuredPriorityLevel;
}

export class BehaviorMeasured
  extends DomainEntity<BehaviorMeasured>
  implements BehaviorMeasured
{
  public static primary = ['gathered'] as const;
  public static unique = ['gathered'] as const;
}
