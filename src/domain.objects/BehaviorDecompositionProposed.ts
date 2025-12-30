import { DomainLiteral } from 'domain-objects';

/**
 * .what = a proposed behavior within a decomposition plan
 * .why = captures the decomposed scope for a single behavior
 */
interface BehaviorDecompositionProposed {
  /**
   * proposed name for behavior directory
   */
  name: string;

  /**
   * behaviors this one depends on (by name)
   */
  dependsOn: string[];

  /**
   * decomposed content from parent behavior
   */
  decomposed: {
    /**
     * decomposed wish content
     */
    wish: string;

    /**
     * decomposed vision content (null if source vision was empty)
     */
    vision: string | null;
  };
}
class BehaviorDecompositionProposed
  extends DomainLiteral<BehaviorDecompositionProposed>
  implements BehaviorDecompositionProposed {}

export { BehaviorDecompositionProposed };
