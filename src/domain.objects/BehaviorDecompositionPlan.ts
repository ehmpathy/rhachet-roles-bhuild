import { DomainLiteral } from 'domain-objects';

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
   * timestamp of plan generation
   */
  generatedAt: string;
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
