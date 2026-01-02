import { given, then, useBeforeAll, when } from 'test-fns';

import { cloneBehaviorAsset } from '../../../../.test/assets/cloneBehaviorAsset';
import { REPEATABILITY_CONFIG } from '../../../../.test/assets/repeatability';
import { Behavior } from '../../../../domain.objects/Behavior';
import { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { invokeBrainRepl } from '../../../../infra/brain/invokeBrainRepl';
import { getOneBehaviorMeasured } from './getOneBehaviorMeasured';

/**
 * .what = integration tests for getOneBehaviorMeasured orchestrator
 * .why = verifies parallel brain.repl.imagine invocations execute fast
 *
 * @note individual imagine operations are tested in their own test files
 * @note this test focuses on orchestration and parallel execution speed
 */
describe('getOneBehaviorMeasured', () => {
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

  given('[case1] behavior requiring all 4 imagine operations', () => {
    const scene = useBeforeAll(async () => {
      const behavior = new Behavior({
        org: 'test',
        repo: 'repo',
        name: 'test-feature',
      });

      // clone behavior asset to temp dir
      const { files } = await cloneBehaviorAsset({
        behaviorName: 'test-feature',
      });

      const gathered = new BehaviorGathered({
        gatheredAt: new Date().toISOString(),
        behavior,
        contentHash: 'hash-test',
        status: 'constrained',
        files,
        source: { type: 'repo.local' },
      });
      const deptraced = new BehaviorDeptraced({
        deptracedAt: new Date().toISOString(),
        gathered: { behavior, contentHash: 'hash-test' },
        dependsOnDirect: [],
        dependsOnTransitive: [],
      });
      return { gathered, deptraced, basket: [gathered] };
    });

    when('[t0] measuring behavior with parallel imagine ops', () => {
      then.repeatably(REPEATABILITY_CONFIG)(
        'should complete within 60s (parallel execution)',
        async () => {
          const startTime = Date.now();

          const result = await getOneBehaviorMeasured(
            {
              gathered: scene.gathered,
              deptraced: scene.deptraced,
              basket: scene.basket,
            },
            context,
          );

          const elapsed = Date.now() - startTime;

          // parallel execution should complete in ~1 brain.repl call time, not 4x
          // with haiku model, each call ~15-30s, so parallel should be < 60s
          expect(elapsed).toBeLessThan(60000);

          // verify complete measurement structure
          expect(result.gain).toBeDefined();
          expect(result.gain.dimensions.leverage).toBeDefined();
          expect(result.gain.dimensions.yieldage).toBeDefined();
          expect(result.cost).toBeDefined();
          expect(result.cost.dimensions.attend).toBeDefined();
          expect(result.cost.dimensions.expend).toBeDefined();
          expect(typeof result.effect).toBe('number');
          expect(['p0', 'p1', 'p3', 'p5']).toContain(result.priority);
        },
      );

      then.repeatably(REPEATABILITY_CONFIG)(
        'should produce valid effect calculation',
        async () => {
          const result = await getOneBehaviorMeasured(
            {
              gathered: scene.gathered,
              deptraced: scene.deptraced,
              basket: scene.basket,
            },
            context,
          );

          // effect = gain.composite - cost.composite
          const expectedEffect = result.gain.composite - result.cost.composite;
          expect(result.effect).toBeCloseTo(expectedEffect, 2);
        },
      );
    });
  });
});
