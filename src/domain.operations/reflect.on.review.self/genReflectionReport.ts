import type { ReflectOnReflectionAggregate } from '@src/domain.objects/reflect.on.review.self/ReflectOnReflectionAggregate';
import type { ReflectOnReviewSelfWindow } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfWindow';

import { asReflectionCorpusSummary } from './asReflectionCorpusSummary';

/**
 * .what = render a full reflection as a markdown report
 * .why = the durable artifact a human reviews to tune the guard templates —
 *        per-slug aggregate plus a per-review detail table
 */
export const genReflectionReport = (input: {
  aggregate: ReflectOnReflectionAggregate;
  windows: ReflectOnReviewSelfWindow[];
  mode: 'plan' | 'apply';
}): string => {
  const lines: string[] = [];

  // the corpus + reviews phrases come from the shared summary transformer, the
  // same one the stdout tree uses, so the durable report and the terminal summary
  // render the identical count-noun grammar a human cross-reads between them
  const summary = asReflectionCorpusSummary({ aggregate: input.aggregate });
  lines.push('# reflection: self-reviews');
  lines.push('');
  lines.push(`- mode: ${input.mode}`);
  lines.push(`- corpus: ${summary.corpus}`);
  lines.push(`- reviews: ${summary.reviews}`);
  lines.push('');

  // per-slug aggregate table — verdict columns follow the canonical label order
  // (genuine-gain → genuine-noop → feigned-noop) declared on ReflectOnReviewSelfVerdict and
  // used by the stdout rollup + json aggregate, so the same taxonomy reads the same
  // way on every output surface a human cross-references
  lines.push('## per-slug aggregate');
  lines.push('');
  lines.push(
    '| slug | firings | edited | genuine-gain | genuine-noop | feigned-noop |',
  );
  lines.push(
    '|------|--------:|-------:|-------------:|-------------:|-------------:|',
  );
  for (const stat of input.aggregate.slugs) {
    lines.push(
      `| ${stat.slug} | ${stat.firings} | ${stat.firingsWithEdit} | ${stat.verdicts.genuineGain} | ${stat.verdicts.genuineNoop} | ${stat.verdicts.feignedNoop} |`,
    );
  }
  lines.push('');

  // per-review detail table
  lines.push('## per-review detail');
  lines.push('');
  lines.push(
    '| route | slug | stone | edits | read | bash | chars | verdict | reason |',
  );
  lines.push(
    '|-------|------|-------|------:|:----:|-----:|------:|---------|--------|',
  );
  for (const window of input.windows) {
    const read = window.signals.readReviewedArtifact ? '✓' : '·';
    // both empty cells use the same em-dash placeholder so a verdict-less
    // (plan-mode) row renders symmetric `| — | — |`, not a lopsided `| — |  |`
    const verdict = window.verdict?.label ?? '—';
    const reason = window.verdict?.reason ?? '—';
    lines.push(
      `| ${window.route} | ${window.slug} | ${window.stone} | ${window.signals.editCount} | ${read} | ${window.signals.bashCount} | ${window.signals.articulationChars} | ${verdict} | ${asTableCell(reason)} |`,
    );
  }
  lines.push('');

  return lines.join('\n');
};

/**
 * .what = make a text value safe for a single markdown table cell
 * .why = a raw pipe would split the cell into extra columns, and an embedded
 *        line break would split the row across lines — the brain is only asked for a
 *        one-line reason, but that is not enforced, so both are neutralized here to
 *        keep the durable report.md table intact even on a stray multi-line reason.
 *        any run of CR/LF (crlf, lf, or a lone cr) collapses to a single space, so
 *        an old-mac lone-cr reason cannot slip through either.
 */
const asTableCell = (text: string): string =>
  text.replace(/[\r\n]+/g, ' ').replace(/\|/g, '\\|');
