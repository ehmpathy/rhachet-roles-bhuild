import { DomainLiteral } from 'domain-objects';

/**
 * .what = context window consumption analysis for behavior decomposition
 * .why = quantifies whether decomposition is needed based on artifact size
 */
interface BehaviorDecompositionContextAnalysis {
  usage: {
    characters: { quantity: number };
    tokens: { estimate: number };
    window: { percentage: number };
  };
  recommendation: 'DECOMPOSE_REQUIRED' | 'DECOMPOSE_UNNEEDED';
}
class BehaviorDecompositionContextAnalysis
  extends DomainLiteral<BehaviorDecompositionContextAnalysis>
  implements BehaviorDecompositionContextAnalysis {}

export { BehaviorDecompositionContextAnalysis };
