import { DomainLiteral } from 'domain-objects';

/**
 * .what = a behavior that has been persisted to disk
 * .why = encapsulates where a behavior lives (path + name) as a cohesive domain concept
 */
interface BehaviorPersisted {
  /**
   * behavior name (e.g., "large-feature")
   */
  name: string;

  /**
   * absolute path to behavior directory
   */
  path: string;
}
class BehaviorPersisted
  extends DomainLiteral<BehaviorPersisted>
  implements BehaviorPersisted {}

export { BehaviorPersisted };
