import { DomainLiteral } from 'domain-objects';

/**
 * .what = the rolled-up utility stats for one self-review slug across the corpus
 * .why = per-slug aggregates are the actionable output — they reveal which
 *        slugs earn their keep and which are noise across many runs
 */
interface ReflectOnReviewSelfSlugStat {
  /**
   * the self-review slug
   */
  slug: string;

  /**
   * how many times this slug fired across the corpus
   */
  firings: number;

  /**
   * how many firings produced at least one edit within their window
   */
  firingsWithEdit: number;

  /**
   * verdict tallies (null verdicts, from plan mode, are omitted)
   */
  verdicts: {
    genuineGain: number;
    genuineNoop: number;
    feignedNoop: number;
  };
}

/**
 * .what = the full corpus reflection result
 * .why = the machine-wide rollup a human acts on to tune the guard templates
 */
interface ReflectOnReflectionAggregate {
  /**
   * how many transcripts were read
   */
  transcriptsRead: number;

  /**
   * how many transcripts were skipped (corrupt or unreadable)
   */
  transcriptsSkipped: number;

  /**
   * how many distinct projects were swept (project dirs under the corpus root)
   */
  projectsSwept: number;

  /**
   * how many init.behavior route runs were found
   */
  routesFound: number;

  /**
   * total self-review windows reconstructed
   */
  reviewsTotal: number;

  /**
   * per-slug stats, sorted worst-offender first (highest feigned rate)
   */
  slugs: ReflectOnReviewSelfSlugStat[];
}
class ReflectOnReflectionAggregate
  extends DomainLiteral<ReflectOnReflectionAggregate>
  implements ReflectOnReflectionAggregate {}

export { ReflectOnReflectionAggregate, type ReflectOnReviewSelfSlugStat };
