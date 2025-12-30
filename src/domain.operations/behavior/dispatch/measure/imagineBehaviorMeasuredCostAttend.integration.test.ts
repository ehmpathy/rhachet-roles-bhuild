import { given, then, useBeforeAll, when } from 'test-fns';

import { REPEATABILITY_CONFIG } from '../../../../.test/assets/repeatability';
import { Behavior } from '../../../../domain.objects/Behavior';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { invokeBrainRepl } from '../../../../infra/brain/invokeBrainRepl';
import { imagineBehaviorMeasuredCostAttend } from './imagineBehaviorMeasuredCostAttend';

/**
 * .what = integration tests for imagineBehaviorMeasuredCostAttend
 * .why = verifies brain.repl.imagine produces sensible attend (time) estimates
 */
describe('imagineBehaviorMeasuredCostAttend', () => {
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

  given('[case1] simple documentation task', () => {
    const scene = useBeforeAll(async () => {
      const behavior = new Behavior({ org: 'test', repo: 'repo', name: 'add-docs' });
      const gathered = new BehaviorGathered({
        gatheredAt: new Date().toISOString(),
        behavior,
        contentHash: 'hash-docs',
        status: 'criteria',
        files: [],
        wish: 'add api documentation',
        vision: null,
        criteria: 'document all public endpoints with examples',
        source: { type: 'repo.local' },
      });
      return { gathered };
    });

    when('[t0] estimating attend for documentation task', () => {
      then.repeatably(REPEATABILITY_CONFIG)(
        'should estimate reasonable time cost',
        async () => {
          const result = await imagineBehaviorMeasuredCostAttend(
            {
              gathered: scene.gathered,
              config: { cost: { horizon: 24 } },
            },
            context,
          );

          // documentation should have low-moderate time cost
          expect(result.upfront).toBeGreaterThan(0);
          expect(result.upfront).toBeLessThan(4800); // < 80 hours
          expect(result.recurrent).toBeGreaterThanOrEqual(0);
          expect(typeof result.composite).toBe('number');
        },
      );
    });
  });

  given('[case2] complex infrastructure migration', () => {
    const scene = useBeforeAll(async () => {
      const behavior = new Behavior({ org: 'test', repo: 'repo', name: 'db-migration' });
      const gathered = new BehaviorGathered({
        gatheredAt: new Date().toISOString(),
        behavior,
        contentHash: 'hash-infra',
        status: 'criteria',
        files: [],
        wish: 'migrate database to new provider',
        vision: null,
        criteria: 'migrate postgresql from aws rds to gcp cloud sql. zero downtime. data validation required.',
        source: { type: 'repo.local' },
      });
      return { gathered };
    });

    when('[t0] estimating attend for complex task', () => {
      then.repeatably(REPEATABILITY_CONFIG)(
        'should estimate higher time cost than simple tasks',
        async () => {
          const result = await imagineBehaviorMeasuredCostAttend(
            {
              gathered: scene.gathered,
              config: { cost: { horizon: 24 } },
            },
            context,
          );

          // infrastructure migration should have meaningful time cost
          expect(result.upfront).toBeGreaterThan(60); // > 1 hour
          expect(typeof result.recurrent).toBe('number');
          expect(typeof result.composite).toBe('number');
        },
      );
    });
  });
});
