import { given, then, useBeforeAll, when } from 'test-fns';

import { REPEATABILITY_CONFIG } from '../../../../.test/assets/repeatability';
import { Behavior } from '../../../../domain.objects/Behavior';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { invokeBrainRepl } from '../../../../infra/brain/invokeBrainRepl';
import { getOneBehaviorDeptraced } from './getOneBehaviorDeptraced';

/**
 * .what = integration tests for getOneBehaviorDeptraced
 * .why = verifies brain.repl.imagine produces sensible dependency inference
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

  given('[case1] behavior with explicit dependency reference', () => {
    const scene = useBeforeAll(async () => {
      const basket: BehaviorGathered[] = [
        new BehaviorGathered({
          gatheredAt: new Date().toISOString(),
          behavior: new Behavior({ org: 'test', repo: 'repo', name: 'feature-auth' }),
          contentHash: 'hash1',
          status: 'criteria',
          files: [],
          wish: 'implement authentication',
          vision: null,
          criteria: 'must support oauth2 and jwt tokens',
          source: { type: 'repo.local' },
        }),
        new BehaviorGathered({
          gatheredAt: new Date().toISOString(),
          behavior: new Behavior({ org: 'test', repo: 'repo', name: 'feature-dashboard' }),
          contentHash: 'hash2',
          status: 'criteria',
          files: [],
          wish: 'build user dashboard',
          vision: null,
          criteria: 'depends on feature-auth. display user profile and stats.',
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

  given('[case2] behavior with no dependencies', () => {
    const scene = useBeforeAll(async () => {
      const basket: BehaviorGathered[] = [
        new BehaviorGathered({
          gatheredAt: new Date().toISOString(),
          behavior: new Behavior({ org: 'test', repo: 'repo', name: 'standalone-feature' }),
          contentHash: 'hash3',
          status: 'criteria',
          files: [],
          wish: 'add a simple utility function',
          vision: null,
          criteria: 'pure function with no external dependencies',
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
