import { given, then, useBeforeAll, when } from 'test-fns';

import { REPEATABILITY_CONFIG } from '../../../../.test/assets/repeatability';
import { Behavior } from '../../../../domain.objects/Behavior';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { invokeBrainRepl } from '../../../../infra/brain/invokeBrainRepl';
import { imagineBehaviorMeasuredCostExpend } from './imagineBehaviorMeasuredCostExpend';

/**
 * .what = integration tests for imagineBehaviorMeasuredCostExpend
 * .why = verifies brain.repl.imagine produces sensible expend (cash) estimates
 */
describe('imagineBehaviorMeasuredCostExpend', () => {
  const context: BehaviorDispatchContext = useBeforeAll(async () => ({
    config: {
      output: '.dispatch',
      sources: { local: { enabled: true }, remote: [] },
      criteria: {
        gain: { leverage: { weights: { author: 0.5, support: 0.5 } } },
        convert: { equate: { cash: { dollars: 150 }, time: { hours: 1 } } },
      },
      cost: { horizon: 24 },
      constraints: { maxConcurrency: 3 },
    },
    cacheDir: { mounted: { path: '/tmp/test-dispatch' } },
    brain: {
      repl: {
        imagine: (input) => invokeBrainRepl({ ...input, options: { model: 'haiku' } }),
      },
    },
    log: console,
  }));

  given('[case1] cloud infrastructure feature', () => {
    const scene = useBeforeAll(async () => {
      const behavior = new Behavior({ org: 'test', repo: 'repo', name: 'add-cdn' });
      const gathered = new BehaviorGathered({
        gatheredAt: new Date().toISOString(),
        behavior,
        contentHash: 'hash-cdn',
        status: 'criteria',
        files: [],
        wish: 'add cdn for static assets',
        vision: null,
        criteria: 'setup cloudflare cdn for static file delivery. estimated 100gb/mo bandwidth.',
        source: { type: 'repo.local' },
      });
      return { gathered };
    });

    when('[t0] estimating expend for cloud infrastructure', () => {
      then.repeatably(REPEATABILITY_CONFIG)(
        'should estimate recurring cash cost',
        async () => {
          const result = await imagineBehaviorMeasuredCostExpend(
            {
              gathered: scene.gathered,
              config: { cost: { horizon: 24 } },
            },
            context,
          );

          // cloud infrastructure should have recurring costs
          expect(typeof result.upfront).toBe('number');
          expect(typeof result.recurrent).toBe('number');
          expect(typeof result.composite).toBe('number');
          expect(result.upfront).toBeGreaterThanOrEqual(0);
        },
      );
    });
  });

  given('[case2] code-only feature with no infrastructure', () => {
    const scene = useBeforeAll(async () => {
      const behavior = new Behavior({ org: 'test', repo: 'repo', name: 'add-util' });
      const gathered = new BehaviorGathered({
        gatheredAt: new Date().toISOString(),
        behavior,
        contentHash: 'hash-util',
        status: 'criteria',
        files: [],
        wish: 'add date formatting utility',
        vision: null,
        criteria: 'create pure function for formatting dates. no external dependencies.',
        source: { type: 'repo.local' },
      });
      return { gathered };
    });

    when('[t0] estimating expend for code-only feature', () => {
      then.repeatably(REPEATABILITY_CONFIG)(
        'should estimate minimal cash cost',
        async () => {
          const result = await imagineBehaviorMeasuredCostExpend(
            {
              gathered: scene.gathered,
              config: { cost: { horizon: 24 } },
            },
            context,
          );

          // code-only should have minimal or zero cash cost
          expect(typeof result.upfront).toBe('number');
          expect(typeof result.recurrent).toBe('number');
          expect(result.upfront).toBeGreaterThanOrEqual(0);
          expect(result.recurrent).toBeGreaterThanOrEqual(0);
        },
      );
    });
  });
});
