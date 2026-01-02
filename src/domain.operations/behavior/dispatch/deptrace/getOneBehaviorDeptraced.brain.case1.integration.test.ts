import { given, then, useBeforeAll, when } from 'test-fns';

import { cloneBehaviorAsset } from '../../../../.test/assets/cloneBehaviorAsset';
import { REPEATABILITY_CONFIG } from '../../../../.test/assets/repeatability';
import { Behavior } from '../../../../domain.objects/Behavior';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { invokeBrainRepl } from '../../../../infra/brain/invokeBrainRepl';
import { getOneBehaviorDeptraced } from './getOneBehaviorDeptraced';

/**
 * .what = integration test for getOneBehaviorDeptraced with explicit dependencies
 * .why = verifies brain.repl.imagine correctly identifies explicit dependency references
 */
describe('getOneBehaviorDeptraced', () => {
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

  given('[case1] behavior with explicit dependency reference', () => {
    const scene = useBeforeAll(async () => {
      // clone auth behavior asset
      const { files: authFiles } = await cloneBehaviorAsset({
        behaviorName: 'feature-auth',
        suffix: 'case1-auth',
      });

      // clone dashboard behavior asset
      const { files: dashboardFiles } = await cloneBehaviorAsset({
        behaviorName: 'feature-dashboard',
        suffix: 'case1-dashboard',
      });

      const basket: BehaviorGathered[] = [
        new BehaviorGathered({
          gatheredAt: new Date().toISOString(),
          behavior: new Behavior({
            org: 'test',
            repo: 'repo',
            name: 'feature-auth',
          }),
          contentHash: 'hash1',
          status: 'constrained',
          files: authFiles,
          source: { type: 'repo.local' },
        }),
        new BehaviorGathered({
          gatheredAt: new Date().toISOString(),
          behavior: new Behavior({
            org: 'test',
            repo: 'repo',
            name: 'feature-dashboard',
          }),
          contentHash: 'hash2',
          status: 'constrained',
          files: dashboardFiles,
          source: { type: 'repo.local' },
        }),
      ];
      const gathered = basket[1]!;
      return { basket, gathered };
    });

    when('[t0] deptracing behavior with explicit dep reference', () => {
      then.repeatably(REPEATABILITY_CONFIG)(
        'should identify feature-auth as a dependency',
        async () => {
          const result = await getOneBehaviorDeptraced(
            { gathered: scene.gathered, basket: scene.basket },
            context,
          );

          expect(result.dependsOnDirect.length).toBeGreaterThanOrEqual(1);
          const depNames = result.dependsOnDirect.map((d) => d.behavior.name);
          expect(depNames).toContain('feature-auth');
        },
      );
    });
  });
});
