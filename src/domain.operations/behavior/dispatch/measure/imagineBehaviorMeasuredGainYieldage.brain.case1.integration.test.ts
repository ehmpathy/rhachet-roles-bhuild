import { given, then, useBeforeAll, when } from 'test-fns';

import { cloneBehaviorAsset } from '../../../../.test/assets/cloneBehaviorAsset';
import { REPEATABILITY_CONFIG } from '../../../../.test/assets/repeatability';
import { Behavior } from '../../../../domain.objects/Behavior';
import { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { invokeBrainRepl } from '../../../../infra/brain/invokeBrainRepl';
import { imagineBehaviorMeasuredGainYieldage } from './imagineBehaviorMeasuredGainYieldage';

/**
 * .what = integration test for imagineBehaviorMeasuredGainYieldage with revenue feature
 * .why = verifies brain.repl.imagine produces sensible yieldage estimates for revenue-generating features
 */
describe('imagineBehaviorMeasuredGainYieldage', () => {
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
        imagine: (input) =>
          invokeBrainRepl({ ...input, options: { model: 'haiku' } }),
      },
    },
    log: console,
  }));

  given('[case1] revenue-generating feature', () => {
    const scene = useBeforeAll(async () => {
      const behavior = new Behavior({
        org: 'test',
        repo: 'repo',
        name: 'premium-tier',
      });

      // clone behavior asset to temp dir
      const { files } = await cloneBehaviorAsset({
        behaviorName: 'premium-tier',
      });

      const gathered = new BehaviorGathered({
        gatheredAt: new Date().toISOString(),
        behavior,
        contentHash: 'hash-premium',
        status: 'constrained',
        files,
        source: { type: 'repo.local' },
      });
      const deptraced = new BehaviorDeptraced({
        deptracedAt: new Date().toISOString(),
        gathered: { behavior, contentHash: 'hash-premium' },
        dependsOnDirect: [],
        dependsOnTransitive: [],
      });
      return { gathered, deptraced, basket: [gathered] };
    });

    when('[t0] estimating yieldage for revenue feature', () => {
      then.repeatably(REPEATABILITY_CONFIG)(
        'should estimate positive expected yieldage',
        async () => {
          const result = await imagineBehaviorMeasuredGainYieldage(
            {
              gathered: scene.gathered,
              deptraced: scene.deptraced,
              basket: scene.basket,
              config: {
                defaults: { baseYieldage: 500, transitiveMultiplier: 0.3 },
              },
            },
            context,
          );

          // revenue feature should have positive expected yieldage
          expect(result.direct.expected).toBeGreaterThan(0);
          expect(result.direct.chances.length).toBeGreaterThan(0);
        },
      );
    });
  });
});
