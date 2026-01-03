import { DomainEntity } from 'domain-objects';

import type { BehaviorMeasuredPriorityLevel } from './BehaviorMeasured';
import type { BehaviorWorkstreamDeliverable } from './BehaviorWorkstreamDeliverable';

/**
 * .what = a group of related behaviors that can be worked on together
 * .why = enables parallel execution visualization and review ordering
 */

export type BehaviorWorkstreamRank = `r${number}`;

export interface BehaviorWorkstream {
  slug: string;
  name: string;
  rank: BehaviorWorkstreamRank;
  priority: BehaviorMeasuredPriorityLevel;
  deliverables: BehaviorWorkstreamDeliverable[];
}

export class BehaviorWorkstream
  extends DomainEntity<BehaviorWorkstream>
  implements BehaviorWorkstream
{
  public static primary = ['slug'] as const;
  public static unique = ['slug'] as const;
}
