import { DomainLiteral } from 'domain-objects';

import { ReflectOnReviewSelfExperience } from './ReflectOnReviewSelfExperience';
import { ReflectOnReviewSelfSignals } from './ReflectOnReviewSelfSignals';
import { ReflectOnReviewSelfVerdict } from './ReflectOnReviewSelfVerdict';

/**
 * .what = one reconstructed self-review, bounded within a transcript
 * .why = the unit of reflection — a review's slug, where it ran, what happened
 *        inside its window, and (in apply mode) its utility verdict
 *
 * .note = windows are chained: a review's window spans from the prior review's
 *         close (or the stone's `--as passed` trigger) to its own `--as promised`.
 *         only promised reviews become windows in v1 — a triggered-but-abandoned
 *         review carries no slug in the command stream, so it is not reconstructed
 *         (see getAllReviewSelfWindows `.note`).
 */
interface ReflectOnReviewSelfWindow {
  /**
   * the self-review slug (e.g., 'has-questioned-assumptions')
   */
  slug: string;

  /**
   * the stone the review belongs to (e.g., '1.vision')
   */
  stone: string;

  /**
   * the route dir the review ran within (relative, from the trigger command)
   */
  route: string;

  /**
   * the source transcript file
   */
  transcriptPath: string;

  /**
   * the deterministic scalar signals for this window (plan-mode backbone)
   */
  signals: ReflectOnReviewSelfSignals;

  /**
   * the distilled experience for this window — articulation + duration + files;
   * the richer evidence the apply-mode brain grades
   */
  experience: ReflectOnReviewSelfExperience;

  /**
   * the utility verdict (null in plan mode — no brain run)
   */
  verdict: ReflectOnReviewSelfVerdict | null;
}
class ReflectOnReviewSelfWindow
  extends DomainLiteral<ReflectOnReviewSelfWindow>
  implements ReflectOnReviewSelfWindow
{
  public static nested = {
    signals: ReflectOnReviewSelfSignals,
    experience: ReflectOnReviewSelfExperience,
    verdict: ReflectOnReviewSelfVerdict,
  };
}

export { ReflectOnReviewSelfWindow };
