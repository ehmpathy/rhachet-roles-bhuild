import { DomainLiteral } from 'domain-objects';

/**
 * .what = the deterministic signals extracted for one self-review window
 * .why = these are computed purely from the transcript, with no brain — they
 *        are the trustworthy backbone of the utility verdict
 */
interface ReflectOnReviewSelfSignals {
  /**
   * count of Edit/Write tool_use invocations within the window
   */
  editCount: number;

  /**
   * whether a Read of the reviewed artifact occurred within the window
   */
  readReviewedArtifact: boolean;

  /**
   * count of Bash tool_use invocations within the window (e.g., test runs)
   */
  bashCount: number;

  /**
   * total char volume of assistant text within the window (articulation substance)
   */
  articulationChars: number;
}
class ReflectOnReviewSelfSignals
  extends DomainLiteral<ReflectOnReviewSelfSignals>
  implements ReflectOnReviewSelfSignals {}

export { ReflectOnReviewSelfSignals };
