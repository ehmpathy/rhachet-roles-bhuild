import { DomainLiteral, type RefByUnique } from 'domain-objects';

import type { BehaviorArtifact } from './BehaviorArtifact';

/**
 * .what = a feedback artifact linked to a target behavior artifact
 * .why = tracks the relationship between feedback and its target
 */
interface BehaviorFeedback {
  /**
   * full path to the feedback file
   */
  path: string;

  /**
   * reference to the artifact this feedback targets
   */
  against: RefByUnique<typeof BehaviorArtifact>;

  /**
   * feedback version (v1, v2, etc.)
   */
  version: number;

  /**
   * the base filename
   */
  filename: string;
}
class BehaviorFeedback
  extends DomainLiteral<BehaviorFeedback>
  implements BehaviorFeedback
{
  public static unique = ['path'] as const;
}

export { BehaviorFeedback };
