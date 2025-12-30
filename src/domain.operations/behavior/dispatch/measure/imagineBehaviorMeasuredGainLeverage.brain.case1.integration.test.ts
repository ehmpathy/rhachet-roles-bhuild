import { given, then, useBeforeAll, when } from 'test-fns';

import { cloneBehaviorAsset } from '../../../../.test/assets/cloneBehaviorAsset';
import { REPEATABILITY_CONFIG } from '../../../../.test/assets/repeatability';
import { Behavior } from '../../../../domain.objects/Behavior';
import { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { invokeBrainRepl } from '../../../../infra/brain/invokeBrainRepl';
import { imagineBehaviorMeasuredGainLeverage } from './imagineBehaviorMeasuredGainLeverage';

/**
 * .what = integration test for imagineBehaviorMeasuredGainLeverage with automation task
 * .why = verifies brain.repl.imagine produces sensible leverage estimates for time-saving automation
 */
describe('imagineBehaviorMeasuredGainLeverage', () => {
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

  given('[case1] automation behavior with time savings', () => {
    const scene = useBeforeAll(async () => {
      const behavior = new Behavior({ org: 'test', repo: 'repo', name: 'automate-deploys' });

      // clone behavior asset to temp dir
      const { files } = await cloneBehaviorAsset({ behaviorName: 'automate-deploys' });

      const gathered = new BehaviorGathered({
        gatheredAt: new Date().toISOString(),
        behavior,
        contentHash: 'hash-auto',
        status: 'constrained',
        files,
        source: { type: 'repo.local' },
      });
      const deptraced = new BehaviorDeptraced({
        deptracedAt: new Date().toISOString(),
        gathered: { behavior, contentHash: 'hash-auto' },
        dependsOnDirect: [],
        dependsOnTransitive: [],
      });
      return { gathered, deptraced, basket: [gathered] };
    });

    when('[t0] estimating leverage for automation task', () => {
      then.repeatably(REPEATABILITY_CONFIG)(
        'should estimate positive time savings',
        async () => {
          const result = await imagineBehaviorMeasuredGainLeverage(
            {
              gathered: scene.gathered,
              deptraced: scene.deptraced,
              basket: scene.basket,
              config: { weights: { author: 0.5, support: 0.5 } },
            },
            context,
          );

          // automation should save time
          expect(result.direct).toBeGreaterThan(0);
          expect(typeof result.direct).toBe('number');
          expect(typeof result.transitive).toBe('number');
        },
      );
    });
  });
});
