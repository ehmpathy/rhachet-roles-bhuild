import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { cloneOrgBehaviorAsset } from '../../../../.test/assets/cloneBehaviorAsset';
import { Behavior } from '../../../../domain.objects/Behavior';
import { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { invokeBrainRepl } from '../../../../infra/brain/invokeBrainRepl';
import { getAllBehaviorPrioritized } from '../prioritize/getAllBehaviorPrioritized';
import { getAllBehaviorCoordinated } from './getAllBehaviorCoordinated';

/**
 * .what = integration test for getAllBehaviorCoordinated with dependency chain
 * .why = verifies coordination groups dependent behaviors into single workstream
 */
describe('getAllBehaviorCoordinated.brain.case2', () => {
  given('[case2] behaviors with dependency chain', () => {
    const scene = useBeforeAll(async () => {
      // clone behaviors to form a dependency chain: checkout depends on core-api
      const { tempDir: coreApiDir, files: coreApiFiles } =
        await cloneOrgBehaviorAsset({
          behaviorName: 'high-value-core-api',
          suffix: 'coordinate-case2',
        });
      const { tempDir: checkoutDir, files: checkoutFiles } =
        await cloneOrgBehaviorAsset({
          behaviorName: 'high-value-checkout',
          suffix: 'coordinate-case2',
        });

      // independent low-value behavior
      const { tempDir: docsDir, files: docsFiles } =
        await cloneOrgBehaviorAsset({
          behaviorName: 'low-value-internal-docs',
          suffix: 'coordinate-case2',
        });

      // create output dir for coordination results
      const outputDir = path.join(
        os.tmpdir(),
        `test-coordinate-deps-${Date.now()}`,
      );
      await fs.mkdir(outputDir, { recursive: true });

      // track temp dirs for cleanup
      const tempDirs = [coreApiDir, checkoutDir, docsDir];

      const basket: BehaviorGathered[] = [
        new BehaviorGathered({
          gatheredAt: new Date().toISOString(),
          behavior: new Behavior({
            org: 'example',
            repo: 'org',
            name: 'high-value-core-api',
          }),
          contentHash: 'hash-core-api',
          status: 'constrained',
          files: coreApiFiles,
          source: { type: 'repo.local' },
        }),
        new BehaviorGathered({
          gatheredAt: new Date().toISOString(),
          behavior: new Behavior({
            org: 'example',
            repo: 'org',
            name: 'high-value-checkout',
          }),
          contentHash: 'hash-checkout',
          status: 'constrained',
          files: checkoutFiles,
          source: { type: 'repo.local' },
        }),
        new BehaviorGathered({
          gatheredAt: new Date().toISOString(),
          behavior: new Behavior({
            org: 'example',
            repo: 'org',
            name: 'low-value-internal-docs',
          }),
          contentHash: 'hash-docs',
          status: 'constrained',
          files: docsFiles,
          source: { type: 'repo.local' },
        }),
      ];

      const context: BehaviorDispatchContext = {
        config: {
          output: outputDir,
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
      };

      return { basket, context, outputDir, tempDirs };
    });

    // cleanup after tests
    afterAll(async () => {
      await fs.rm(scene.outputDir, { recursive: true, force: true });
      for (const tempDir of scene.tempDirs) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });

    when('[t0] running prioritize → coordinate with dependencies', () => {
      // execute pipeline once and reuse result
      const pipelineResult = useBeforeAll(async () => {
        // step 1: prioritize behaviors using brain.repl
        const prioritized = await getAllBehaviorPrioritized(
          { gatheredBasket: scene.basket },
          scene.context,
        );

        // step 2: create deptraced basket with dependency: checkout -> core-api
        const coreApiTriaged = prioritized.behaviors.find(
          (t) => t.gathered.behavior.name === 'high-value-core-api',
        );
        const checkoutTriaged = prioritized.behaviors.find(
          (t) => t.gathered.behavior.name === 'high-value-checkout',
        );
        const docsTriaged = prioritized.behaviors.find(
          (t) => t.gathered.behavior.name === 'low-value-internal-docs',
        );

        const deptracedBasket = [
          // core-api has no dependencies
          new BehaviorDeptraced({
            deptracedAt: new Date().toISOString(),
            gathered: coreApiTriaged!.gathered,
            dependsOnDirect: [],
            dependsOnTransitive: [],
          }),
          // checkout depends on core-api
          new BehaviorDeptraced({
            deptracedAt: new Date().toISOString(),
            gathered: checkoutTriaged!.gathered,
            dependsOnDirect: [
              {
                behavior: coreApiTriaged!.gathered.behavior,
                contentHash: 'hash-core-api',
              },
            ],
            dependsOnTransitive: [
              {
                behavior: coreApiTriaged!.gathered.behavior,
                contentHash: 'hash-core-api',
              },
            ],
          }),
          // docs is independent
          new BehaviorDeptraced({
            deptracedAt: new Date().toISOString(),
            gathered: docsTriaged!.gathered,
            dependsOnDirect: [],
            dependsOnTransitive: [],
          }),
        ];

        // step 3: coordinate into workstreams
        const coordinated = await getAllBehaviorCoordinated(
          { triagedBasket: prioritized.behaviors, deptracedBasket },
          scene.context,
        );

        return { prioritized, coordinated };
      });

      then('it executes with success', () => {
        expect(pipelineResult.coordinated).toBeDefined();
        expect(pipelineResult.coordinated.workstreams).toBeDefined();
      });

      then('dependent behaviors should group into single workstream', () => {
        // dependent behaviors (core-api, checkout) form 1 workstream
        // independent behavior (docs) forms 1 workstream
        expect(pipelineResult.coordinated.workstreams).toHaveLength(2);
        expect(pipelineResult.coordinated.stats.workstreams).toEqual(2);
        expect(pipelineResult.coordinated.stats.deliverables).toEqual(3);

        // find the workstream with 2 deliverables (the dependent group)
        const dependentWorkstream = pipelineResult.coordinated.workstreams.find(
          (ws) => ws.deliverables.length === 2,
        );
        expect(dependentWorkstream).toBeDefined();
        const deliverableNames = dependentWorkstream!.deliverables.map(
          (d) => d.gathered.behavior.name,
        );
        expect(deliverableNames).toContain('high-value-core-api');
        expect(deliverableNames).toContain('high-value-checkout');
      });

      then('workstream with high-priority behaviors should rank first', () => {
        // workstream with high-value behaviors should rank first (r1)
        const firstWorkstream = pipelineResult.coordinated.workstreams.find(
          (ws) => ws.rank === 'r1',
        );
        expect(firstWorkstream).toBeDefined();

        // priority should be p0 or p1 (high-value)
        const priorityOrder = { p0: 0, p1: 1, p3: 2, p5: 3 };
        expect(priorityOrder[firstWorkstream!.priority]).toBeLessThanOrEqual(
          priorityOrder.p1,
        );
      });
    });
  });
});
