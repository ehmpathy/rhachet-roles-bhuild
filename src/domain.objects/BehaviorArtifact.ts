import { DomainLiteral } from 'domain-objects';

/**
 * .what = a behavior artifact that can be targeted for feedback
 * .why = provides identity and version info for artifact resolution
 */
interface BehaviorArtifact {
  /**
   * full path to the artifact file
   */
  path: string;

  /**
   * artifact name extracted from filename (e.g., 'execution', 'criteria.blackbox')
   */
  name: string;

  /**
   * version number if present in filename (vX), null otherwise
   */
  version: number | null;

  /**
   * attempt number if present in filename (iX), null otherwise
   */
  attempt: number | null;

  /**
   * the base filename without path
   */
  filename: string;
}
class BehaviorArtifact
  extends DomainLiteral<BehaviorArtifact>
  implements BehaviorArtifact
{
  public static primary = ['path'] as const;
  public static unique = ['path'] as const;
}

export { BehaviorArtifact };
