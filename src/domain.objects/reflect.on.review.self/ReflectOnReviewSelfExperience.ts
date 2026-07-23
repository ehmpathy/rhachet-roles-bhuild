import { DomainLiteral } from 'domain-objects';

import { ReflectOnReviewSelfFileTouch } from './ReflectOnReviewSelfFileTouch';

/**
 * .what = the distilled experience of one self-review — what the reviewer wrote,
 *         how long it took, and every artifact file it touched
 * .why = the four scalar `ReflectOnReviewSelfSignals` reveal behavior but discard the one
 *        artifact that proves the critique was real: the articulation file plus
 *        the actual diffs. the experience retains that evidence so the apply-mode
 *        brain grades the critique itself, not a compressed signal vector
 *
 * .note = a bounded distillation, not a firehose — per-file diffs and the file
 *         list are capped upstream so 800+ windows stay cheap for the cheap brain
 */
interface ReflectOnReviewSelfExperience {
  /**
   * the content of the review's articulation file (the `review/self/…` critique),
   * or null when no articulation write appears in the window
   */
  articulation: string | null;

  /**
   * how long the review took, in milliseconds (last event − first event), or
   * null when the window's events carry no timestamps
   */
  durationMs: number | null;

  /**
   * every artifact file the review touched (reads + writes), the articulation
   * write left out — its content lives in `articulation`
   */
  files: ReflectOnReviewSelfFileTouch[];
}
class ReflectOnReviewSelfExperience
  extends DomainLiteral<ReflectOnReviewSelfExperience>
  implements ReflectOnReviewSelfExperience
{
  public static nested = {
    files: ReflectOnReviewSelfFileTouch,
  };
}

export { ReflectOnReviewSelfExperience };
