import { given, then, useBeforeAll, when } from 'test-fns';

import { cloneBehaviorAsset } from '../../../../.test/assets/cloneBehaviorAsset';
import { REPEATABILITY_CONFIG } from '../../../../.test/assets/repeatability';
import { Behavior } from '../../../../domain.objects/Behavior';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { invokeBrainRepl } from '../../../../infra/brain/invokeBrainRepl';
import { imagineBehaviorMeasuredCostAttend } from './imagineBehaviorMeasuredCostAttend';

/**
 * .what = integration test for imagineBehaviorMeasuredCostAttend with simple task
 * .why = verifies brain.repl.imagine produces sensible attend (time) estimates for documentation
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
      cost: { horizon: { weeks: 24 } },
      constraints: { maxConcurrency: 3 },
    },
    cacheDir: { mounted: { path: '/tmp/test-dispatch' } },
    brain: {
      repl: {
        imagine: (input) =>
          invokeBrainRepl({ ...input, options: { model: 'haiku' } }),
      },
    },
    log: console,
  }));

  given('[case1] simple documentation task', () => {
    const scene = useBeforeAll(async () => {
      const behavior = new Behavior({
        org: 'test',
        repo: 'repo',
        name: 'add-docs',
      });

      // clone behavior asset to temp dir
      const { files } = await cloneBehaviorAsset({ behaviorName: 'add-docs' });

      const gathered = new BehaviorGathered({
        gatheredAt: new Date().toISOString(),
        behavior,
        contentHash: 'hash-docs',
        status: 'constrained',
        files,
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
              config: { cost: { horizon: { weeks: 24 } } },
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
});
