import { DomainLiteral } from 'domain-objects';

import { DreamArtifact } from './DreamArtifact';

/**
 * .what = a fuzzy match candidate — dream artifact with distance score
 * .why = enables typo recovery without latency on happy path
 */
interface DreamCandidate {
  /**
   * the matched dream artifact
   */
  dream: DreamArtifact;

  /**
   * how close the match is (lower = closer)
   * e.g., edit distance
   */
  distance: number;
}
class DreamCandidate
  extends DomainLiteral<DreamCandidate>
  implements DreamCandidate
{
  public static nested = { dream: DreamArtifact };
}

export { DreamCandidate };
