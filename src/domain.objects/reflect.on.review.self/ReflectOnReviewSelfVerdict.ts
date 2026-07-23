import { DomainLiteral } from 'domain-objects';

/**
 * .what = the utility label for a self-review, drawn from deterministic signals
 *         plus (in apply mode) a cheap-brain judgment
 * .why = the three buckets separate reviews that earned their keep from noise
 *
 * - genuine-gain  = the review led to a real upgrade of the artifact
 * - genuine-noop  = the review looked, found no gap, correctly left it as-is
 * - feigned-noop  = the review promised without a real review (rubber stamp)
 */
export type ReflectOnReviewSelfVerdictLabel =
  | 'genuine-gain'
  | 'genuine-noop'
  | 'feigned-noop';

/**
 * .what = a verdict for one self-review window
 * .why = pairs the label with the reason so tuning decisions are explainable
 */
interface ReflectOnReviewSelfVerdict {
  /**
   * the utility bucket
   */
  label: ReflectOnReviewSelfVerdictLabel;

  /**
   * a one-line reason for the label (from the brain in apply mode)
   */
  reason: string;
}
class ReflectOnReviewSelfVerdict
  extends DomainLiteral<ReflectOnReviewSelfVerdict>
  implements ReflectOnReviewSelfVerdict {}

export { ReflectOnReviewSelfVerdict };
