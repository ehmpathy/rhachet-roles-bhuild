import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { cloneOrgBehaviorAsset } from '../../../../.test/assets/cloneBehaviorAsset';
import { REPEATABILITY_CONFIG } from '../../../../.test/assets/repeatability';
import { Behavior } from '../../../../domain.objects/Behavior';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { invokeBrainRepl } from '../../../../infra/brain/invokeBrainRepl';
import { getAllBehaviorPrioritized } from './getAllBehaviorPrioritized';

/**
 * .what = integration test for getAllBehaviorPrioritized with high vs low value behaviors
 * .why = verifies brain.repl correctly prioritizes high yieldage/leverage work over low value work
 */
describe('getAllBehaviorPrioritized.brain.case1', () => {
  given('[case1] basket with high-value and low-value behaviors', () => {
    const scene = useBeforeAll(async () => {
      // clone high-value behaviors (creates temp dirs for behavior files)
      const { tempDir: coreApiDir, files: coreApiFiles } =
        await cloneOrgBehaviorAsset({
          behaviorName: 'high-value-core-api',
          suffix: 'prioritize-case1',
        });
      const { tempDir: checkoutDir, files: checkoutFiles } =
        await cloneOrgBehaviorAsset({
          behaviorName: 'high-value-checkout',
          suffix: 'prioritize-case1',
        });

      // clone low-value behaviors (creates temp dirs for behavior files)
      const { tempDir: docsDir, files: docsFiles } =
        await cloneOrgBehaviorAsset({
          behaviorName: 'low-value-internal-docs',
          suffix: 'prioritize-case1',
        });
      const { tempDir: cleanupDir, files: cleanupFiles } =
        await cloneOrgBehaviorAsset({
          behaviorName: 'low-value-code-cleanup',
          suffix: 'prioritize-case1',
        });

      // create output dir for prioritization results (separate from behavior files)
      const outputDir = path.join(os.tmpdir(), `test-prioritize-${Date.now()}`);
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

    when('[t0] prioritizing mixed basket of behaviors', () => {
      then.repeatably(REPEATABILITY_CONFIG)(
        'high-value behaviors should have higher priority than low-value',
        async () => {
          const result = await getAllBehaviorPrioritized(
            { gatheredBasket: scene.basket },
            scene.context,
          );

          // find the priorities
          const coreApiPriority = result.behaviors.find(
            (b) => b.gathered.behavior.name === 'high-value-core-api',
          )?.priority;
          const checkoutPriority = result.behaviors.find(
            (b) => b.gathered.behavior.name === 'high-value-checkout',
          )?.priority;
          const docsPriority = result.behaviors.find(
            (b) => b.gathered.behavior.name === 'low-value-internal-docs',
          )?.priority;
          const cleanupPriority = result.behaviors.find(
            (b) => b.gathered.behavior.name === 'low-value-code-cleanup',
          )?.priority;

          // priority values: p0 > p1 > p3 > p5
          // expect high-value to be p0 or p1, low-value to be p3 or p5
          const priorityOrder = { p0: 0, p1: 1, p3: 2, p5: 3 };

          // high-value behaviors should have better (lower number) priority
          expect(priorityOrder[coreApiPriority!]).toBeLessThanOrEqual(
            priorityOrder.p1,
          );
          expect(priorityOrder[checkoutPriority!]).toBeLessThanOrEqual(
            priorityOrder.p1,
          );

          // low-value behaviors should have worse (higher number) priority
          expect(priorityOrder[docsPriority!]).toBeGreaterThanOrEqual(
            priorityOrder.p3,
          );
          expect(priorityOrder[cleanupPriority!]).toBeGreaterThanOrEqual(
            priorityOrder.p3,
          );
        },
      );

      then.repeatably(REPEATABILITY_CONFIG)(
        'should generate prioritization output files',
        async () => {
          const result = await getAllBehaviorPrioritized(
            { gatheredBasket: scene.basket },
            scene.context,
          );

          // check output files exist
          const prioritizationMd = await fs.readFile(
            result.outputs.prioritizationMd,
            'utf-8',
          );
          expect(prioritizationMd).toContain('prioritization');

          const prioritizationJson = JSON.parse(
            await fs.readFile(result.outputs.prioritizationJson, 'utf-8'),
          );
          expect(prioritizationJson).toHaveLength(4);
        },
      );

      then.repeatably(REPEATABILITY_CONFIG)(
        'should return correct stats',
        async () => {
          const result = await getAllBehaviorPrioritized(
            { gatheredBasket: scene.basket },
            scene.context,
          );

          expect(result.stats.gathered).toEqual(4);
          expect(
            result.stats.now + result.stats.soon + result.stats.later,
          ).toEqual(4);
        },
      );
    });
  });
});
