import { given, then, useBeforeAll, when } from 'test-fns';

import { cloneBehaviorAsset } from '../../../../.test/assets/cloneBehaviorAsset';
import { REPEATABILITY_CONFIG } from '../../../../.test/assets/repeatability';
import { Behavior } from '../../../../domain.objects/Behavior';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { invokeBrainRepl } from '../../../../infra/brain/invokeBrainRepl';
import { computeBehaviorDeptracedTransitiveDeps } from './computeBehaviorDeptracedTransitiveDeps';

/**
 * .what = integration test for computeBehaviorDeptracedTransitiveDeps with dep chain
 * .why = verifies brain.repl correctly computes transitive dependency closure
 */
describe('computeBehaviorDeptracedTransitiveDeps.brain.case1', () => {
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

  given('[case1] behavior with direct dependency', () => {
    const scene = useBeforeAll(async () => {
      // clone auth behavior (the dependency - has no deps itself)
      const { files: authFiles } = await cloneBehaviorAsset({
        behaviorName: 'feature-auth',
        suffix: 'compute-trans-case1-auth',
      });

      // clone dashboard behavior (depends on auth)
      const { files: dashboardFiles } = await cloneBehaviorAsset({
        behaviorName: 'feature-dashboard',
        suffix: 'compute-trans-case1-dashboard',
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

    when(
      '[t0] computing transitive deps for behavior with one direct dep',
      () => {
        then.repeatably(REPEATABILITY_CONFIG)(
          'should have feature-auth in direct deps',
          async () => {
            const result = await computeBehaviorDeptracedTransitiveDeps(
              { gathered: scene.gathered, basket: scene.basket },
              context,
            );

            expect(result.direct.length).toBeGreaterThanOrEqual(1);
            const directNames = result.direct.map((d) => d.behavior.name);
            expect(directNames).toContain('feature-auth');
          },
        );

        then.repeatably(REPEATABILITY_CONFIG)(
          'should have feature-auth in transitive deps',
          async () => {
            const result = await computeBehaviorDeptracedTransitiveDeps(
              { gathered: scene.gathered, basket: scene.basket },
              context,
            );

            // transitive includes all direct deps plus their deps
            const transitiveNames = result.transitive.map(
              (d) => d.behavior.name,
            );
            expect(transitiveNames).toContain('feature-auth');
          },
        );

        then.repeatably(REPEATABILITY_CONFIG)(
          'should not have circular dependencies',
          async () => {
            const result = await computeBehaviorDeptracedTransitiveDeps(
              { gathered: scene.gathered, basket: scene.basket },
              context,
            );

            expect(result.circular).toEqual(false);
          },
        );
      },
    );
  });
});
