import { given, then, when } from 'test-fns';

import { ReflectOnReviewSelfExperience } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfExperience';
import { ReflectOnReviewSelfSignals } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfSignals';
import { ReflectOnReviewSelfVerdict } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfVerdict';
import { ReflectOnReviewSelfWindow } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfWindow';

import { computeReflectionAggregate } from './computeReflectionAggregate';
import { genReflectionStdout } from './genReflectionStdout';

/**
 * .what = an empty experience — the stdout renderer reads signals, not experience
 */
const EMPTY_EXPERIENCE = new ReflectOnReviewSelfExperience({
  articulation: null,
  durationMs: null,
  files: [],
});

/**
 * .what = build a window with the given slug, edit count, and optional verdict
 */
const asWindow = (input: {
  slug: string;
  edits: number;
  verdict: ReflectOnReviewSelfVerdict['label'] | null;
}): ReflectOnReviewSelfWindow =>
  new ReflectOnReviewSelfWindow({
    slug: input.slug,
    stone: '1.vision',
    route: '.behavior/x',
    transcriptPath: '/t.jsonl',
    signals: new ReflectOnReviewSelfSignals({
      editCount: input.edits,
      readReviewedArtifact: input.edits > 0,
      bashCount: 0,
      articulationChars: 200,
    }),
    experience: EMPTY_EXPERIENCE,
    verdict: input.verdict
      ? new ReflectOnReviewSelfVerdict({
          label: input.verdict,
          reason: 'because',
        })
      : null,
  });

/**
 * .what = stable display paths for the wrote-section of the tree
 * .why = the renderer now closes with the report + json leaves; a fixed pair
 *        keeps the snapshot deterministic (the CLI passes real display paths)
 */
const OUTPUTS = {
  reportPath: '~/.rhachet/reflect/report.md',
  jsonPath: '~/.rhachet/reflect/report.v1.json',
};

const WINDOWS = [
  asWindow({
    slug: 'has-questioned-questions',
    edits: 0,
    verdict: 'feigned-noop',
  }),
  asWindow({
    slug: 'has-questioned-questions',
    edits: 0,
    verdict: 'feigned-noop',
  }),
  asWindow({
    slug: 'has-questioned-assumptions',
    edits: 1,
    verdict: 'genuine-gain',
  }),
  asWindow({
    slug: 'has-questioned-assumptions',
    edits: 2,
    verdict: 'genuine-noop',
  }),
];

describe('genReflectionStdout', () => {
  given('[case1] an aggregate with a clear worst offender', () => {
    const aggregate = computeReflectionAggregate({
      windows: WINDOWS,
      transcriptsRead: 3,
      transcriptsSkipped: 1,
      projectsSwept: 2,
      routesFound: 2,
    });

    when('[t0] rendered in plan mode', () => {
      const stdout = genReflectionStdout({
        aggregate,
        mode: 'plan',
        outputs: OUTPUTS,
      });

      then('it matches the plan-mode snapshot', () => {
        expect(stdout).toMatchSnapshot();
      });

      then('it shows the corpus counts and worst offender first', () => {
        expect(stdout).toContain('3 transcripts read · 1 skipped');
        expect(stdout).toContain('4 reviews promised');
        const firstSlugLine = stdout
          .split('\n')
          .find((line) => line.includes('has-questioned'));
        expect(firstSlugLine).toContain('has-questioned-questions');
      });

      then('it opens with the behaver mascot header', () => {
        expect(stdout).toContain('🦫 heres the reflection');
        expect(stdout).toContain('🌲 reflect.on.reviews.self --mode plan');
      });

      then(
        'it closes with the wrote-section, not a bespoke footer glyph',
        () => {
          expect(stdout).toContain('   └─ wrote');
          expect(stdout).toContain('report = ~/.rhachet/reflect/report.md');
          expect(stdout).not.toContain('🌊');
        },
      );

      then('it omits the verdict rollup (no brain in plan mode)', () => {
        expect(stdout).not.toContain('genuine-gain');
      });
    });

    when('[t1] rendered in apply mode', () => {
      const stdout = genReflectionStdout({
        aggregate,
        mode: 'apply',
        outputs: OUTPUTS,
      });

      then('it matches the apply-mode snapshot', () => {
        expect(stdout).toMatchSnapshot();
      });

      then('it shows the verdict rollup with shares', () => {
        expect(stdout).toContain('🟢 genuine-gain');
        expect(stdout).toContain('🟡 genuine-noop');
        expect(stdout).toContain('🔴 feigned-noop');
      });
    });
  });

  given('[case2] an empty aggregate', () => {
    const aggregate = computeReflectionAggregate({
      windows: [],
      transcriptsRead: 0,
      transcriptsSkipped: 0,
      projectsSwept: 0,
      routesFound: 0,
    });

    when('[t0] rendered in plan mode', () => {
      const stdout = genReflectionStdout({
        aggregate,
        mode: 'plan',
        outputs: OUTPUTS,
      });

      then('it reports no windows found', () => {
        expect(stdout).toContain('no self-review windows found');
      });

      then('the empty-state render matches its snapshot', () => {
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given(
    '[case3] a slug that is mostly genuine-noops with one lone feigned',
    () => {
      // a review that looked carefully and correctly found no gap most of the time,
      // with a single feigned outlier, is NOT a worst offender — its icon must be
      // green, consistent with its low worst-offender rank (regression for the
      // prior icon logic that compared feigned only against genuine-gain)
      const aggregate = computeReflectionAggregate({
        windows: [
          asWindow({
            slug: 'mostly-genuine',
            edits: 0,
            verdict: 'genuine-noop',
          }),
          asWindow({
            slug: 'mostly-genuine',
            edits: 0,
            verdict: 'genuine-noop',
          }),
          asWindow({
            slug: 'mostly-genuine',
            edits: 0,
            verdict: 'genuine-noop',
          }),
          asWindow({
            slug: 'mostly-genuine',
            edits: 0,
            verdict: 'feigned-noop',
          }),
        ],
        transcriptsRead: 1,
        transcriptsSkipped: 0,
        projectsSwept: 1,
        routesFound: 1,
      });

      when('[t0] rendered in apply mode', () => {
        const stdout = genReflectionStdout({
          aggregate,
          mode: 'apply',
          outputs: OUTPUTS,
        });

        then(
          'the slug renders green, not red (icon agrees with the rank)',
          () => {
            const slugLine = stdout
              .split('\n')
              .find((line) => line.includes('mostly-genuine'))!;
            expect(slugLine).toContain('🟢');
            expect(slugLine).not.toContain('🔴');
          },
        );
      });
    },
  );
});
