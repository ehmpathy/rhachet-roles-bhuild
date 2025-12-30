import { DomainEntity, type RefByUnique } from 'domain-objects';

import type { BehaviorGathered } from './BehaviorGathered';
import type { BehaviorMeasuredPriorityLevel } from './BehaviorMeasured';

/**
 * .what = represents a behavior with urgency assignment
 * .why = enables scheduling by combining priority with readiness/bandwidth constraints
 */

export type BehaviorTriagedUrgencyLevel = 'now' | 'soon' | 'later';

export interface BehaviorTriagedDimensions {
  readiness: BehaviorTriagedUrgencyLevel;
  bandwidth: BehaviorTriagedUrgencyLevel;
}

export interface BehaviorTriaged {
  triagedAt: string;
  gathered: RefByUnique<typeof BehaviorGathered>;
  dimensions: BehaviorTriagedDimensions;
  decision: BehaviorTriagedUrgencyLevel;
  priority: BehaviorMeasuredPriorityLevel;
}

export class BehaviorTriaged
  extends DomainEntity<BehaviorTriaged>
  implements BehaviorTriaged
{
  public static primary = ['gathered'] as const;
  public static unique = ['gathered'] as const;
}
