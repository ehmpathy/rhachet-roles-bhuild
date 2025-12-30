import { DomainLiteral, type RefByUnique } from 'domain-objects';

import type { BehaviorGathered } from './BehaviorGathered';
import type { BehaviorMeasuredPriorityLevel } from './BehaviorMeasured';
import type { BehaviorTriagedUrgencyLevel } from './BehaviorTriaged';

/**
 * .what = a behavior positioned within a workstream
 * .why = enables ordered execution within workstreams with priority/urgency context
 */
export interface BehaviorWorkstreamDeliverable {
  gathered: RefByUnique<typeof BehaviorGathered>;
  priority: BehaviorMeasuredPriorityLevel;
  decision: BehaviorTriagedUrgencyLevel;
  effect: number;
}

export class BehaviorWorkstreamDeliverable
  extends DomainLiteral<BehaviorWorkstreamDeliverable>
  implements BehaviorWorkstreamDeliverable {}
