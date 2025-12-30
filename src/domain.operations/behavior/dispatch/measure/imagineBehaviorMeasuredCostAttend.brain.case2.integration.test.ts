import { given, then, useBeforeAll, when } from 'test-fns';

import { cloneBehaviorAsset } from '../../../../.test/assets/cloneBehaviorAsset';
import { REPEATABILITY_CONFIG } from '../../../../.test/assets/repeatability';
import { Behavior } from '../../../../domain.objects/Behavior';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { invokeBrainRepl } from '../../../../infra/brain/invokeBrainRepl';
import { imagineBehaviorMeasuredCostAttend } from './imagineBehaviorMeasuredCostAttend';

/**
 * .what = integration test for imagineBehaviorMeasuredCostAttend with complex task
 * .why = verifies brain.repl.imagine produces sensible attend (time) estimates for infrastructure
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

  given('[case2] complex infrastructure migration', () => {
    const scene = useBeforeAll(async () => {
      const behavior = new Behavior({ org: 'test', repo: 'repo', name: 'db-migration' });

      // clone behavior asset to temp dir
      const { files } = await cloneBehaviorAsset({ behaviorName: 'db-migration' });

      const gathered = new BehaviorGathered({
        gatheredAt: new Date().toISOString(),
        behavior,
        contentHash: 'hash-infra',
        status: 'constrained',
        files,
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
