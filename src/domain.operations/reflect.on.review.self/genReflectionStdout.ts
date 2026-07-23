import type {
  ReflectOnReflectionAggregate,
  ReflectOnReviewSelfSlugStat,
} from '@src/domain.objects/reflect.on.review.self/ReflectOnReflectionAggregate';

import { asReflectionCorpusSummary } from './asReflectionCorpusSummary';

/**
 * .what = render a reflection aggregate as a treestruct stdout summary
 * .why = a scannable, corpus-wide verdict a human can act on to tune reviews
 *
 * @param mode - 'plan' (deterministic only) or 'apply' (with brain verdicts)
 * @param outputs - the display paths of the report + json the run wrote, shown
 *                  as the final tree branch so the whole summary is one tree
 */
export const genReflectionStdout = (input: {
  aggregate: ReflectOnReflectionAggregate;
  mode: 'plan' | 'apply';
  outputs: { reportPath: string; jsonPath: string };
}): string => {
  const { aggregate } = input;
  const summary = asReflectionCorpusSummary({ aggregate });
  const lines: string[] = [];

  // open with the behaver mascot header — the beaver hello + the tree-glyph
  // command echo — to match every peer behaver skill (give.feedback,
  // init.behavior, feedback.take), so this skill reads as one of the family, not
  // an outlier with a bespoke 🔍 header
  lines.push('🦫 heres the reflection');
  lines.push('');
  lines.push(`🌲 reflect.on.reviews.self --mode ${input.mode}`);

  // the corpus + reviews phrases come from the shared summary transformer, so the
  // stdout tree and the markdown report render the identical count-noun grammar
  lines.push(`   ├─ corpus  = ${summary.corpus}`);
  lines.push(`   ├─ reviews = ${summary.reviews}`);

  // in apply mode, show the corpus verdict rollup
  if (input.mode === 'apply') {
    const rollup = asVerdictRollup({ aggregate });
    lines.push('   ├─ verdict');
    lines.push(
      `   │  ├─ 🟢 genuine-gain  ${padCount(rollup.genuineGain)}  (${asPct(rollup.genuineGain, rollup.total)})`,
    );
    lines.push(
      `   │  ├─ 🟡 genuine-noop  ${padCount(rollup.genuineNoop)}  (${asPct(rollup.genuineNoop, rollup.total)})`,
    );
    lines.push(
      `   │  └─ 🔴 feigned-noop  ${padCount(rollup.feignedNoop)}  (${asPct(rollup.feignedNoop, rollup.total)})`,
    );
  }

  // per-slug worst offenders — a mid-tree branch now (the wrote-section is the
  // final branch), so its children carry the `│` continuation
  lines.push('   ├─ per-slug (worst offenders)');
  const shown = aggregate.slugs.slice(0, 10);
  const slugLines = shown.map((stat, index) => {
    const prefix = index === shown.length - 1 ? '   │  └─' : '   │  ├─';
    return `${prefix} ${asSlugLine({ stat, mode: input.mode })}`;
  });
  lines.push(...slugLines);
  // an empty aggregate is a valid input to this pure renderer, so it renders a
  // graceful empty-state row rather than a bare header. the CLI caller guards
  // against empty via failOnEmptySweep, so this is unreached there today — but the
  // renderer stays robust for reuse (e.g. the planned bhrain generalization)
  if (shown.length === 0) lines.push('   │  └─ (no self-review windows found)');

  // the wrote-section is the final tree branch — the durable artifacts a human
  // opens to act on the verdict, in-tree rather than a bespoke footer glyph
  lines.push('   └─ wrote');
  lines.push(`      ├─ report = ${input.outputs.reportPath}`);
  lines.push(`      └─ json   = ${input.outputs.jsonPath}`);

  return lines.join('\n');
};

/**
 * .what = one per-slug summary line
 * .why = shows edit rate and (apply mode) feigned tally at a glance
 */
const asSlugLine = (input: {
  stat: ReflectOnReviewSelfSlugStat;
  mode: 'plan' | 'apply';
}): string => {
  const { stat } = input;
  const editPart = `${stat.firingsWithEdit}/${stat.firings} edited`;

  if (input.mode === 'plan') {
    // plan mode has no verdict — a zero-edit review may be a correct genuine-noop,
    // so show the deterministic edit signal with a neutral marker, not a good/bad
    // color that would wrongly nudge a human to cut a legitimately-correct review.
    // the marker is the em-dash `—`, the same "not judged yet" glyph the markdown
    // report uses in its empty verdict/reason cells — one skill-wide convention
    return `— ${padSlug(stat.slug)} ${editPart}`;
  }

  const feigned = stat.verdicts.feignedNoop;
  const icon = isFeignedDominant({ stat }) ? '🔴' : '🟢';
  return `${icon} ${padSlug(stat.slug)} ${editPart} · ${feigned}/${stat.firings} feigned-noop`;
};

/**
 * .what = whether feigned-noop is the dominant verdict for a slug
 * .why = the red/green icon must agree with the worst-offender SORT, which ranks
 *        by feigned SHARE of all labeled verdicts. the prior check compared feigned
 *        only against genuine-gain and ignored genuine-noop, so a slug that is
 *        mostly correct genuine-noops with one stray feigned rendered red while the
 *        sort ranked it low — a self-contradictory cue. red now means feigned-noop
 *        is the plurality bucket (>= gain AND >= noop, and non-zero), so a
 *        mostly-genuine-noop slug reads green, consistent with its low rank
 */
const isFeignedDominant = (input: {
  stat: ReflectOnReviewSelfSlugStat;
}): boolean => {
  const { feignedNoop, genuineNoop, genuineGain } = input.stat.verdicts;
  return (
    feignedNoop > 0 && feignedNoop >= genuineGain && feignedNoop >= genuineNoop
  );
};

/**
 * .what = sum verdict tallies across all slugs
 * .why = the corpus-wide rollup shown in apply mode
 */
const asVerdictRollup = (input: {
  aggregate: ReflectOnReflectionAggregate;
}): {
  genuineGain: number;
  genuineNoop: number;
  feignedNoop: number;
  total: number;
} => {
  const summed = input.aggregate.slugs.reduce(
    (acc, stat) => ({
      genuineGain: acc.genuineGain + stat.verdicts.genuineGain,
      genuineNoop: acc.genuineNoop + stat.verdicts.genuineNoop,
      feignedNoop: acc.feignedNoop + stat.verdicts.feignedNoop,
    }),
    { genuineGain: 0, genuineNoop: 0, feignedNoop: 0 },
  );
  return {
    ...summed,
    total: summed.genuineGain + summed.genuineNoop + summed.feignedNoop,
  };
};

/**
 * .what = format a count as a percentage of a total (0% when total is 0)
 * .why = the rollup shows shares, not just raw counts
 */
const asPct = (count: number, total: number): string => {
  if (total === 0) return '0%';
  return `${Math.round((count / total) * 100)}%`;
};

/**
 * .what = right-pad a count to a fixed width for column alignment
 * .why = keeps the numeric column edges flush so the summary scans cleanly
 */
const padCount = (count: number): string => String(count).padStart(4);

/**
 * .what = right-pad a slug to a fixed width for column alignment
 * .why = keeps the slug column edges flush so downstream columns line up
 */
const padSlug = (slug: string): string => slug.padEnd(34);
