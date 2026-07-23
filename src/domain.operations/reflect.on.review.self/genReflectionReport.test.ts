import { given, then, when } from 'test-fns';

import { ReflectOnReviewSelfExperience } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfExperience';
import { ReflectOnReviewSelfSignals } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfSignals';
import { ReflectOnReviewSelfVerdict } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfVerdict';
import { ReflectOnReviewSelfWindow } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfWindow';

import { computeReflectionAggregate } from './computeReflectionAggregate';
import { genReflectionReport } from './genReflectionReport';

/**
 * .what = an empty experience — the report reads signals + verdict, not experience
 */
const EMPTY_EXPERIENCE = new ReflectOnReviewSelfExperience({
  articulation: null,
  durationMs: null,
  files: [],
});

/**
 * .what = build a window with the given slug, route, edits, and optional verdict
 */
const asWindow = (input: {
  slug: string;
  route: string;
  edits: number;
  verdict: ReflectOnReviewSelfVerdict['label'] | null;
  reason?: string;
}): ReflectOnReviewSelfWindow =>
  new ReflectOnReviewSelfWindow({
    slug: input.slug,
    stone: '1.vision',
    route: input.route,
    transcriptPath: '/t.jsonl',
    signals: new ReflectOnReviewSelfSignals({
      editCount: input.edits,
      readReviewedArtifact: input.edits > 0,
      bashCount: 1,
      articulationChars: 320,
    }),
    experience: EMPTY_EXPERIENCE,
    verdict: input.verdict
      ? new ReflectOnReviewSelfVerdict({
          label: input.verdict,
          reason: input.reason ?? 'because',
        })
      : null,
  });

// each fixture's reason agrees with its verdict label, so the documented snapshot
// reads as a coherent example — a feigned-noop reason describes a rubber-stamp, a
// genuine-gain reason describes a real edit after a real read
const WINDOWS = [
  asWindow({
    slug: 'has-questioned-questions',
    route: '.behavior/a',
    edits: 0,
    verdict: 'feigned-noop',
    reason: 'the clone restated the questions and promised without triage',
  }),
  asWindow({
    slug: 'has-questioned-assumptions',
    route: '.behavior/b',
    edits: 2,
    verdict: 'genuine-gain',
    reason:
      'the clone surfaced a real gap and edited the artifact after a read',
  }),
];

describe('genReflectionReport', () => {
  given('[case1] a corpus with two reviews across two routes', () => {
    const aggregate = computeReflectionAggregate({
      windows: WINDOWS,
      transcriptsRead: 2,
      transcriptsSkipped: 0,
      projectsSwept: 2,
      routesFound: 2,
    });

    when('[t0] rendered in apply mode', () => {
      const report = genReflectionReport({
        aggregate,
        windows: WINDOWS,
        mode: 'apply',
      });

      then('it matches the markdown snapshot', () => {
        expect(report).toMatchSnapshot();
      });

      then('the per-review detail table carries the route column', () => {
        expect(report).toContain(
          '| route | slug | stone | edits | read | bash | chars | verdict | reason |',
        );
        expect(report).toContain('| .behavior/a | has-questioned-questions |');
      });

      then('it renders the per-slug aggregate rows', () => {
        expect(report).toContain('## per-slug aggregate');
        expect(report).toContain('| has-questioned-questions | 1 | 0 |');
      });
    });

    when('[t1] rendered in plan mode (windows carry no verdict)', () => {
      const planWindows = [
        asWindow({
          slug: 'has-questioned-questions',
          route: '.behavior/a',
          edits: 0,
          verdict: null,
        }),
        asWindow({
          slug: 'has-questioned-assumptions',
          route: '.behavior/b',
          edits: 2,
          verdict: null,
        }),
      ];
      const planAggregate = computeReflectionAggregate({
        windows: planWindows,
        transcriptsRead: 2,
        transcriptsSkipped: 0,
        projectsSwept: 2,
        routesFound: 2,
      });
      const report = genReflectionReport({
        aggregate: planAggregate,
        windows: planWindows,
        mode: 'plan',
      });

      then('it matches the plan-mode markdown snapshot', () => {
        expect(report).toMatchSnapshot();
      });

      then('verdict cells are the unlabeled placeholder', () => {
        expect(report).toContain('| — |');
      });
    });
  });

  given('[case2] a verdict whose reason carries line breaks and a pipe', () => {
    // the brain is asked for a one-line reason, but that is not enforced — a
    // stray crlf, lf, lone cr, or raw pipe in the reason would split the markdown
    // row across lines or into extra columns. this proves the cell is sanitized.
    const window = asWindow({
      slug: 'has-questioned-assumptions',
      route: '.behavior/a',
      edits: 1,
      verdict: 'genuine-gain',
      reason: 'line one\r\nline two\nline three\rline four | with a pipe',
    });
    const aggregate = computeReflectionAggregate({
      windows: [window],
      transcriptsRead: 1,
      transcriptsSkipped: 0,
      projectsSwept: 1,
      routesFound: 1,
    });

    when('[t0] rendered in apply mode', () => {
      const report = genReflectionReport({
        aggregate,
        windows: [window],
        mode: 'apply',
      });

      then('every crlf, lf, and lone cr collapses to a single space', () => {
        expect(report).toContain(
          'line one line two line three line four \\| with a pipe',
        );
      });

      then('the reason cell holds no raw line break', () => {
        // the per-review detail row is the last non-blank line — it must be whole
        const detailRow = report
          .split('\n')
          .find((line) => line.includes('line one'));
        expect(detailRow).toBeDefined();
        expect(detailRow).not.toContain('\r');
      });

      then('the raw pipe is escaped, not left to spawn a column', () => {
        expect(report).toContain('\\| with a pipe');
        expect(report).not.toContain('four | with');
      });
    });
  });
});
