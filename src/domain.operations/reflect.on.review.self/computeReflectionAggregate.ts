import {
  ReflectOnReflectionAggregate,
  type ReflectOnReviewSelfSlugStat,
} from '@src/domain.objects/reflect.on.review.self/ReflectOnReflectionAggregate';
import type { ReflectOnReviewSelfVerdict } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfVerdict';
import type { ReflectOnReviewSelfWindow } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfWindow';

/**
 * .what = roll up reconstructed windows into per-slug corpus stats
 * .why = the machine-wide per-slug view is the actionable output — it reveals
 *        which slugs earn their keep and which are noise across many runs
 *
 * .note = slugs are sorted worst-offender first (highest feigned-noop share,
 *         then lowest edit rate) so the reviews to cut surface at the top
 */
export const computeReflectionAggregate = (input: {
  windows: ReflectOnReviewSelfWindow[];
  transcriptsRead: number;
  transcriptsSkipped: number;
  projectsSwept: number;
  routesFound: number;
}): ReflectOnReflectionAggregate => {
  // one stat per distinct slug, sorted worst-offender first
  const distinctSlugs = [
    ...new Set(input.windows.map((window) => window.slug)),
  ];
  const slugs = distinctSlugs
    .map((slug) =>
      computeSlugStat({
        slug,
        windows: input.windows.filter((window) => window.slug === slug),
      }),
    )
    .sort(compareByWorstOffender);

  return new ReflectOnReflectionAggregate({
    transcriptsRead: input.transcriptsRead,
    transcriptsSkipped: input.transcriptsSkipped,
    projectsSwept: input.projectsSwept,
    routesFound: input.routesFound,
    reviewsTotal: input.windows.length,
    slugs,
  });
};

/**
 * .what = fold all windows of one slug into its aggregate stat
 * .why = per-slug fire, edit, and verdict tallies are the actionable rows
 */
const computeSlugStat = (input: {
  slug: string;
  windows: ReflectOnReviewSelfWindow[];
}): ReflectOnReviewSelfSlugStat => ({
  slug: input.slug,
  firings: input.windows.length,
  firingsWithEdit: input.windows.filter(
    (window) => window.signals.editCount > 0,
  ).length,
  verdicts: {
    genuineGain: countVerdict({
      windows: input.windows,
      label: 'genuine-gain',
    }),
    genuineNoop: countVerdict({
      windows: input.windows,
      label: 'genuine-noop',
    }),
    feignedNoop: countVerdict({
      windows: input.windows,
      label: 'feigned-noop',
    }),
  },
});

/**
 * .what = count the windows that hold a given verdict label
 * .why = the per-slug verdict distribution (apply mode)
 */
const countVerdict = (input: {
  windows: ReflectOnReviewSelfWindow[];
  label: ReflectOnReviewSelfVerdict['label'];
}): number =>
  input.windows.filter((window) => window.verdict?.label === input.label)
    .length;

/**
 * .what = order two slug stats so the worst offender sorts first
 * .why = the human wants the reviews to cut at the top of the list —
 *        highest feigned share, then lowest edit rate, then most firings
 */
const compareByWorstOffender = (
  a: ReflectOnReviewSelfSlugStat,
  b: ReflectOnReviewSelfSlugStat,
): number => {
  const feignedShareA = asFeignedShare({ stat: a });
  const feignedShareB = asFeignedShare({ stat: b });
  if (feignedShareA !== feignedShareB) return feignedShareB - feignedShareA;

  const editRateA = a.firingsWithEdit / Math.max(a.firings, 1);
  const editRateB = b.firingsWithEdit / Math.max(b.firings, 1);
  if (editRateA !== editRateB) return editRateA - editRateB;

  return b.firings - a.firings;
};

/**
 * .what = the share of a slug's firings labeled feigned-noop (0 when unlabeled)
 * .why = the primary worst-offender rank key
 */
const asFeignedShare = (input: {
  stat: ReflectOnReviewSelfSlugStat;
}): number => {
  const labeled =
    input.stat.verdicts.genuineGain +
    input.stat.verdicts.genuineNoop +
    input.stat.verdicts.feignedNoop;
  if (labeled === 0) return 0;
  return input.stat.verdicts.feignedNoop / labeled;
};
