import { given, then, when } from 'test-fns';

import { ReflectOnReflectionAggregate } from '@src/domain.objects/reflect.on.review.self/ReflectOnReflectionAggregate';

import { asReflectionCorpusSummary } from './asReflectionCorpusSummary';

/**
 * .what = build an aggregate with just the count fields this transformer reads
 * .why = the per-slug list is irrelevant to the corpus/reviews text
 */
const asAggregate = (input: {
  routesFound: number;
  projectsSwept: number;
  transcriptsRead: number;
  transcriptsSkipped: number;
  reviewsTotal: number;
}): ReflectOnReflectionAggregate =>
  new ReflectOnReflectionAggregate({ ...input, slugs: [] });

describe('asReflectionCorpusSummary', () => {
  given('[case1] a multi-count corpus (every field plural)', () => {
    when('[t0] summarized', () => {
      const summary = asReflectionCorpusSummary({
        aggregate: asAggregate({
          routesFound: 78,
          projectsSwept: 173,
          transcriptsRead: 1003,
          transcriptsSkipped: 2,
          reviewsTotal: 812,
        }),
      });

      then('the corpus phrase pluralizes every count', () => {
        expect(summary.corpus).toEqual(
          '78 route runs · 173 projects · 1003 transcripts read · 2 skipped',
        );
      });

      then('the reviews phrase pluralizes', () => {
        expect(summary.reviews).toEqual('812 reviews promised');
      });
    });
  });

  given('[case2] a narrowed corpus where every count is one (singular)', () => {
    // a --route / --project drill-down routinely yields n=1; the singular grammar
    // is the whole reason this text is shared — both renderers must agree
    when('[t0] summarized', () => {
      const summary = asReflectionCorpusSummary({
        aggregate: asAggregate({
          routesFound: 1,
          projectsSwept: 1,
          transcriptsRead: 1,
          transcriptsSkipped: 0,
          reviewsTotal: 1,
        }),
      });

      then('the corpus phrase singularizes every count at one', () => {
        expect(summary.corpus).toEqual(
          '1 route run · 1 project · 1 transcript read · 0 skipped',
        );
      });

      then('the reviews phrase singularizes at one', () => {
        expect(summary.reviews).toEqual('1 review promised');
      });
    });
  });
});
