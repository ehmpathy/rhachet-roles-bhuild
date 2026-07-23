import { given, then, when } from 'test-fns';

import { ReflectOnReviewSelfExperience } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfExperience';
import { ReflectOnReviewSelfSignals } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfSignals';
import { ReflectOnReviewSelfWindow } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfWindow';

import { computeReflectionAggregate } from './computeReflectionAggregate';

/**
 * .what = an empty experience — the aggregate reads signals, not the experience
 */
const EMPTY_EXPERIENCE = new ReflectOnReviewSelfExperience({
  articulation: null,
  durationMs: null,
  files: [],
});

/**
 * .what = build a window with the given slug and edit count
 */
const asWindow = (input: { slug: string; edits: number }): ReflectOnReviewSelfWindow =>
  new ReflectOnReviewSelfWindow({
    slug: input.slug,
    stone: '1.vision',
    route: '.behavior/x',
    transcriptPath: '/t.jsonl',
    signals: new ReflectOnReviewSelfSignals({
      editCount: input.edits,
      readReviewedArtifact: false,
      bashCount: 0,
      articulationChars: 100,
    }),
    experience: EMPTY_EXPERIENCE,
    verdict: null,
  });

describe('computeReflectionAggregate', () => {
  given('[case1] two slugs — one always edits, one never edits', () => {
    const windows = [
      asWindow({ slug: 'high-yield', edits: 1 }),
      asWindow({ slug: 'high-yield', edits: 2 }),
      asWindow({ slug: 'noise', edits: 0 }),
      asWindow({ slug: 'noise', edits: 0 }),
    ];

    when('[t0] the windows are aggregated', () => {
      const aggregate = computeReflectionAggregate({
        windows,
        transcriptsRead: 5,
        transcriptsSkipped: 1,
        projectsSwept: 3,
        routesFound: 2,
      });

      then('it tallies firings and edits per slug', () => {
        const noise = aggregate.slugs.find((s) => s.slug === 'noise')!;
        expect(noise.firings).toEqual(2);
        expect(noise.firingsWithEdit).toEqual(0);

        const highYield = aggregate.slugs.find((s) => s.slug === 'high-yield')!;
        expect(highYield.firings).toEqual(2);
        expect(highYield.firingsWithEdit).toEqual(2);
      });

      then('it sorts the never-edits (worst offender) slug first', () => {
        expect(aggregate.slugs[0]!.slug).toEqual('noise');
      });

      then('it carries the corpus counts through', () => {
        expect(aggregate.transcriptsRead).toEqual(5);
        expect(aggregate.transcriptsSkipped).toEqual(1);
        expect(aggregate.projectsSwept).toEqual(3);
        expect(aggregate.routesFound).toEqual(2);
        expect(aggregate.reviewsTotal).toEqual(4);
      });
    });
  });
});
