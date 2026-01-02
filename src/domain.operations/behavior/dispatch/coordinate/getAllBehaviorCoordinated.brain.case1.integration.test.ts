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
import type { BehaviorPrioritizedResult } from '../prioritize/getAllBehaviorPrioritized';
import { getAllBehaviorPrioritized } from '../prioritize/getAllBehaviorPrioritized';
import type { BehaviorCoordinatedResult } from './getAllBehaviorCoordinated';
import { getAllBehaviorCoordinated } from './getAllBehaviorCoordinated';

/**
 * .what = integration test for getAllBehaviorCoordinated with independent behaviors
 * .why = verifies coordination groups independent behaviors into separate workstreams
 */
describe('getAllBehaviorCoordinated.brain.case1', () => {
  given(
    '[case1] basket with high-value and low-value behaviors (independent)',
    () => {
      const scene = useBeforeAll(async () => {
        // clone high-value behaviors (creates temp dirs for behavior files)
        const { tempDir: coreApiDir, files: coreApiFiles } =
          await cloneOrgBehaviorAsset({
            behaviorName: 'high-value-core-api',
            suffix: 'coordinate-case1',
          });
        const { tempDir: checkoutDir, files: checkoutFiles } =
          await cloneOrgBehaviorAsset({
            behaviorName: 'high-value-checkout',
            suffix: 'coordinate-case1',
          });

        // clone low-value behaviors (creates temp dirs for behavior files)
        const { tempDir: docsDir, files: docsFiles } =
          await cloneOrgBehaviorAsset({
            behaviorName: 'low-value-internal-docs',
            suffix: 'coordinate-case1',
          });
        const { tempDir: cleanupDir, files: cleanupFiles } =
          await cloneOrgBehaviorAsset({
            behaviorName: 'low-value-code-cleanup',
            suffix: 'coordinate-case1',
          });

        // create output dir for coordination results (separate from behavior files)
        const outputDir = path.join(
          os.tmpdir(),
          `test-coordinate-${Date.now()}`,
        );
        await fs.mkdir(outputDir, { recursive: true });

        // track temp dirs for cleanup
        const tempDirs = [coreApiDir, checkoutDir, docsDir, cleanupDir];

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
          new BehaviorGathered({
            gatheredAt: new Date().toISOString(),
            behavior: new Behavior({
              org: 'example',
              repo: 'org',
              name: 'low-value-code-cleanup',
            }),
            contentHash: 'hash-cleanup',
            status: 'constrained',
            files: cleanupFiles,
            source: { type: 'repo.local' },
          }),
        ];

        const context: BehaviorDispatchContext = {
          config: {
            output: outputDir,
            sources: { local: { enabled: true }, remote: [] },
            criteria: {
              gain: { leverage: { weights: { author: 0.5, support: 0.5 } } },
              convert: {
                equate: { cash: { dollars: 150 }, time: { hours: 1 } },
              },
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

      when('[t0] running prioritize → coordinate pipeline', () => {
        // result shared across then blocks
        let pipelineResult: {
          prioritized: BehaviorPrioritizedResult;
          coordinated: BehaviorCoordinatedResult;
        };

        then('it executes with success', async () => {
          // step 1: prioritize behaviors using brain.repl
          const prioritized = await getAllBehaviorPrioritized(
            { gatheredBasket: scene.basket },
            scene.context,
          );

          // step 2: create deptraced basket (no dependencies for this case)
          const deptracedBasket = prioritized.behaviors.map(
            (triaged) =>
              new BehaviorDeptraced({
                deptracedAt: new Date().toISOString(),
                gathered: triaged.gathered,
                dependsOnDirect: [],
                dependsOnTransitive: [],
              }),
          );

          // step 3: coordinate into workstreams
          const coordinated = await getAllBehaviorCoordinated(
            { triagedBasket: prioritized.behaviors, deptracedBasket },
            scene.context,
          );

          // set result for other then blocks
          pipelineResult = { prioritized, coordinated };

          // verify success
          expect(pipelineResult.coordinated).toBeDefined();
          expect(pipelineResult.coordinated.workstreams).toBeDefined();
        });

        then('independent behaviors should form separate workstreams', () => {
          expect(pipelineResult.coordinated.workstreams).toHaveLength(4);
          expect(pipelineResult.coordinated.stats.workstreams).toEqual(4);
          expect(pipelineResult.coordinated.stats.deliverables).toEqual(4);
        });

        then(
          'high-priority workstreams should rank before low-priority',
          () => {
            // workstreams are ranked by priority
            const priorityOrder = { p0: 0, p1: 1, p3: 2, p5: 3 };
            const ranks = pipelineResult.coordinated.workstreams.map((ws) => ({
              rank: ws.rank,
              priority: ws.priority,
              name: ws.deliverables[0]?.gathered.behavior.name,
            }));

            // verify ranks are in order (r1, r2, r3, r4)
            expect(ranks.map((r) => r.rank)).toEqual(['r1', 'r2', 'r3', 'r4']);

            // verify priorities are non-increasing (higher priority first)
            for (let i = 1; i < ranks.length; i++) {
              const prevPriority = priorityOrder[ranks[i - 1]!.priority];
              const currPriority = priorityOrder[ranks[i]!.priority];
              expect(prevPriority).toBeLessThanOrEqual(currPriority);
            }
          },
        );

        then('should generate coordination output files', async () => {
          // check output files exist
          const coordinationMd = await fs.readFile(
            pipelineResult.coordinated.outputs.coordinationMd,
            'utf-8',
          );
          expect(coordinationMd).toContain('coordination');

          const coordinationJson = JSON.parse(
            await fs.readFile(
              pipelineResult.coordinated.outputs.coordinationJson,
              'utf-8',
            ),
          );
          expect(coordinationJson).toHaveLength(4);
        });
      });
    },
  );
});
