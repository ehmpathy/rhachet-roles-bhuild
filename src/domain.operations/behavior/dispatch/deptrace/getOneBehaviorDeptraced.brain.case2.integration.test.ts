import { given, then, useBeforeAll, when } from 'test-fns';

import { cloneBehaviorAsset } from '../../../../.test/assets/cloneBehaviorAsset';
import { REPEATABILITY_CONFIG } from '../../../../.test/assets/repeatability';
import { Behavior } from '../../../../domain.objects/Behavior';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { invokeBrainRepl } from '../../../../infra/brain/invokeBrainRepl';
import { getOneBehaviorDeptraced } from './getOneBehaviorDeptraced';

/**
 * .what = integration test for getOneBehaviorDeptraced with no dependencies
 * .why = verifies brain.repl.imagine correctly identifies standalone behaviors
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

  given('[case2] behavior with no dependencies', () => {
    const scene = useBeforeAll(async () => {
      // clone standalone behavior asset
      const { files } = await cloneBehaviorAsset({
        behaviorName: 'standalone-feature',
      });

      const basket: BehaviorGathered[] = [
        new BehaviorGathered({
          gatheredAt: new Date().toISOString(),
          behavior: new Behavior({
            org: 'test',
            repo: 'repo',
            name: 'standalone-feature',
          }),
          contentHash: 'hash3',
          status: 'constrained',
          files,
          source: { type: 'repo.local' },
        }),
      ];
      const gathered = basket[0]!;
      return { basket, gathered };
    });

    when('[t0] deptracing standalone behavior', () => {
      then.repeatably(REPEATABILITY_CONFIG)(
        'should identify no dependencies',
        async () => {
          const result = await getOneBehaviorDeptraced(
            { gathered: scene.gathered, basket: scene.basket },
            context,
          );

          expect(result.dependsOnDirect).toHaveLength(0);
          expect(result.dependsOnTransitive).toHaveLength(0);
        },
      );
    });
  });
});
