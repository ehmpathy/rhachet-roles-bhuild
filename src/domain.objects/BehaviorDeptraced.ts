import { DomainEntity, type RefByUnique } from 'domain-objects';

import type { BehaviorGathered } from './BehaviorGathered';

/**
 * .what = represents a behavior with resolved dependency graph
 * .why = enables transitive impact scoring by knowing what depends on what
 */
export interface BehaviorDeptraced {
  deptracedAt: string;
  gathered: RefByUnique<typeof BehaviorGathered>;
  dependsOnDirect: RefByUnique<typeof BehaviorGathered>[];
  dependsOnTransitive: RefByUnique<typeof BehaviorGathered>[];
}

export class BehaviorDeptraced
  extends DomainEntity<BehaviorDeptraced>
  implements BehaviorDeptraced
{
  public static primary = ['gathered'] as const;
  public static unique = ['gathered'] as const;
}
