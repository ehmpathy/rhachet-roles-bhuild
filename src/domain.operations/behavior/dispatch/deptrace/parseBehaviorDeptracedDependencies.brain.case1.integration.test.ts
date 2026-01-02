import { given, then, useBeforeAll, when } from 'test-fns';

import { cloneBehaviorAsset } from '../../../../.test/assets/cloneBehaviorAsset';
import { REPEATABILITY_CONFIG } from '../../../../.test/assets/repeatability';
import { Behavior } from '../../../../domain.objects/Behavior';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { invokeBrainRepl } from '../../../../infra/brain/invokeBrainRepl';
import { parseBehaviorDeptracedDependencies } from './parseBehaviorDeptracedDependencies';

/**
 * .what = integration test for parseBehaviorDeptracedDependencies with explicit deps
 * .why = verifies brain.repl correctly identifies explicit dependency references in content
 */
describe('parseBehaviorDeptracedDependencies.brain.case1', () => {
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

  given(
    '[case1] behavior with explicit "depends on" reference in criteria',
    () => {
      const scene = useBeforeAll(async () => {
        // clone auth behavior (the dependency)
        const { files: authFiles } = await cloneBehaviorAsset({
          behaviorName: 'feature-auth',
          suffix: 'parse-deps-case1-auth',
        });

        // clone dashboard behavior (has explicit dep on auth)
        const { files: dashboardFiles } = await cloneBehaviorAsset({
          behaviorName: 'feature-dashboard',
          suffix: 'parse-deps-case1-dashboard',
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

        // dashboard depends on auth
        const gathered = basket[1]!;
        return { basket, gathered };
      });

      when('[t0] parsing behavior with explicit dependency reference', () => {
        then.repeatably(REPEATABILITY_CONFIG)(
          'should identify feature-auth as a dependency',
          async () => {
            const result = await parseBehaviorDeptracedDependencies(
              { gathered: scene.gathered, basket: scene.basket },
              context,
            );

            expect(result.length).toBeGreaterThanOrEqual(1);
            const depNames = result.map((d) => d.behavior.name);
            expect(depNames).toContain('feature-auth');
          },
        );
      });
    },
  );
});
