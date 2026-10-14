import { DomainLiteral } from 'domain-objects';
import type { IsoDateStamp } from 'iso-time';

import { BehaviorDecompositionContextAnalysis } from './BehaviorDecompositionContextAnalysis';
import { BehaviorDecompositionProposed } from './BehaviorDecompositionProposed';
import { BehaviorPersisted } from './BehaviorPersisted';

/**
 * .what = a plan to decompose a behavior into focused sub behaviors
 * .why = enables review before apply, supports iterative refinement
 */
interface BehaviorDecompositionPlan {
  /**
   * source behavior to decompose
   */
  behaviorSource: BehaviorPersisted;

  /**
   * proposed behaviors
   */
  behaviorsProposed: BehaviorDecompositionProposed[];

  /**
   * context window analysis
   */
  contextAnalysis: BehaviorDecompositionContextAnalysis;

  /**
   * the day the plan was generated, as a datestamp (YYYY-MM-DD)
   *
   * .note = the plan persists into a tracked behavior dir, so it holds no time of day
   *         (rule.forbid.timestamps-in-tracked-files). a plan file from before may hold an
   *         instant; computePlanFromFile casts it to its day on read
   */
  generatedAt: IsoDateStamp;
}
class BehaviorDecompositionPlan
  extends DomainLiteral<BehaviorDecompositionPlan>
  implements BehaviorDecompositionPlan
{
  public static nested = {
    behaviorSource: BehaviorPersisted,
    behaviorsProposed: BehaviorDecompositionProposed,
    contextAnalysis: BehaviorDecompositionContextAnalysis,
  };
}

export { BehaviorDecompositionPlan };
