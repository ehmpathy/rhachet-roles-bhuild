import type { ReflectOnReflectionAggregate } from '@src/domain.objects/reflect.on.review.self/ReflectOnReflectionAggregate';

/**
 * .what = the corpus + reviews count phrases, shared by every renderer
 * .why = the treestruct stdout and the markdown report both summarize the same
 *        aggregate; when each formatted its own counts, they drifted (the tree
 *        singularized at n=1, the report never did — a human who cross-reads the
 *        two saw them disagree). one source for both phrases makes the two
 *        surfaces agree by construction, not by luck
 */
export const asReflectionCorpusSummary = (input: {
  aggregate: ReflectOnReflectionAggregate;
}): { corpus: string; reviews: string } => {
  const { aggregate } = input;
  return {
    corpus: [
      asCount(aggregate.routesFound, 'route run', 'route runs'),
      asCount(aggregate.projectsSwept, 'project', 'projects'),
      asCount(aggregate.transcriptsRead, 'transcript read', 'transcripts read'),
      `${aggregate.transcriptsSkipped} skipped`,
    ].join(' · '),
    reviews: asCount(
      aggregate.reviewsTotal,
      'review promised',
      'reviews promised',
    ),
  };
};

/**
 * .what = format a count with a noun that matches its number (singular at n=1)
 * .why = a narrowed --route/--project sweep routinely yields n=1; hardcoded
 *        plurals would render "1 route runs" — broken grammar the user sees on
 *        every drill-down. the same helper both renderers reuse keeps grammar
 *        agreement identical across the stdout tree and the markdown report
 */
export const asCount = (
  count: number,
  singular: string,
  plural: string,
): string => `${count} ${count === 1 ? singular : plural}`;
