import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { BehaviorTriaged } from '../../../../domain.objects/BehaviorTriaged';
import { getAllBehaviorCoordinated } from './getAllBehaviorCoordinated';

/**
 * .what = creates a mock BehaviorGathered for testing
 */
const mockGathered = (input: { name: string }): BehaviorGathered =>
  new BehaviorGathered({
    gatheredAt: new Date().toISOString(),
    behavior: { org: 'test', repo: 'repo', name: input.name },
    contentHash: `hash-${input.name}`,
    status: 'wished',
    files: [],
    source: { type: 'repo.local' },
  });

/**
 * .what = creates a mock BehaviorDeptraced for testing
 */
const mockDeptraced = (input: {
  name: string;
  directDeps?: string[];
  transitiveDeps?: string[];
}): BehaviorDeptraced =>
  new BehaviorDeptraced({
    deptracedAt: new Date().toISOString(),
    gathered: mockGathered({ name: input.name }),
    dependsOnDirect: (input.directDeps ?? []).map((n) => ({
      behavior: { org: 'test', repo: 'repo', name: n },
      contentHash: `hash-${n}`,
    })),
    dependsOnTransitive: (input.transitiveDeps ?? []).map((n) => ({
      behavior: { org: 'test', repo: 'repo', name: n },
      contentHash: `hash-${n}`,
    })),
  });

/**
 * .what = creates a mock BehaviorTriaged for testing
 */
const mockTriaged = (input: {
  name: string;
  priority: 'p0' | 'p1' | 'p3' | 'p5';
  decision: 'now' | 'soon' | 'later';
}): BehaviorTriaged =>
  new BehaviorTriaged({
    triagedAt: new Date().toISOString(),
    gathered: mockGathered({ name: input.name }),
    dimensions: { readiness: input.decision, bandwidth: input.decision },
    decision: input.decision,
    priority: input.priority,
  });

/**
 * .what = creates a mock context for testing
 */
const mockContext = (input: { outputDir: string }) => ({
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  config: {
    sources: { local: { enabled: true }, remote: [] },
    output: input.outputDir,
    constraints: { maxConcurrency: 3 },
    cost: { horizon: 52 },
    gain: {
      hourlyRate: 100,
      defaults: { baseYieldage: 100, transitiveMultiplier: 0.5 },
    },
    weights: { author: 1, support: 1 },
  },
  cacheDir: { mounted: { path: '/tmp/cache' } },
  brain: { repl: { imagine: jest.fn() } },
});

describe('getAllBehaviorCoordinated', () => {
  given('[case1] independent behaviors', () => {
    when('[t0] behaviors have no dependencies', () => {
      then('each becomes its own workstream', async () => {
        const tempDir = path.join(os.tmpdir(), `test-coord-${Date.now()}-1`);
        await fs.mkdir(tempDir, { recursive: true });

        const triagedBasket = [
          mockTriaged({ name: 'feature-a', priority: 'p1', decision: 'now' }),
          mockTriaged({ name: 'feature-b', priority: 'p1', decision: 'now' }),
        ];
        const deptracedBasket = [
          mockDeptraced({ name: 'feature-a' }),
          mockDeptraced({ name: 'feature-b' }),
        ];

        const result = await getAllBehaviorCoordinated(
          { triagedBasket, deptracedBasket },
          mockContext({ outputDir: tempDir }) as any,
        );

        expect(result.workstreams).toHaveLength(2);
        expect(result.stats.workstreams).toEqual(2);
        expect(result.stats.deliverables).toEqual(2);

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case2] dependent behaviors', () => {
    when('[t0] behaviors form a dependency chain', () => {
      then('all are grouped into one workstream', async () => {
        const tempDir = path.join(os.tmpdir(), `test-coord-${Date.now()}-2`);
        await fs.mkdir(tempDir, { recursive: true });

        // A <- B <- C (C depends on B depends on A)
        const triagedBasket = [
          mockTriaged({ name: 'a', priority: 'p1', decision: 'now' }),
          mockTriaged({ name: 'b', priority: 'p1', decision: 'soon' }),
          mockTriaged({ name: 'c', priority: 'p1', decision: 'later' }),
        ];
        const deptracedBasket = [
          mockDeptraced({ name: 'a' }),
          mockDeptraced({
            name: 'b',
            directDeps: ['a'],
            transitiveDeps: ['a'],
          }),
          mockDeptraced({
            name: 'c',
            directDeps: ['b'],
            transitiveDeps: ['b', 'a'],
          }),
        ];

        const result = await getAllBehaviorCoordinated(
          { triagedBasket, deptracedBasket },
          mockContext({ outputDir: tempDir }) as any,
        );

        expect(result.workstreams).toHaveLength(1);
        expect(result.workstreams[0]?.deliverables).toHaveLength(3);
        expect(result.stats.deliverables).toEqual(3);

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case3] workstream ranking', () => {
    when('[t0] workstreams have different priorities', () => {
      then('higher priority workstream ranks first', async () => {
        const tempDir = path.join(os.tmpdir(), `test-coord-${Date.now()}-3`);
        await fs.mkdir(tempDir, { recursive: true });

        const triagedBasket = [
          mockTriaged({ name: 'low', priority: 'p5', decision: 'now' }),
          mockTriaged({ name: 'critical', priority: 'p0', decision: 'now' }),
        ];
        const deptracedBasket = [
          mockDeptraced({ name: 'low' }),
          mockDeptraced({ name: 'critical' }),
        ];

        const result = await getAllBehaviorCoordinated(
          { triagedBasket, deptracedBasket },
          mockContext({ outputDir: tempDir }) as any,
        );

        expect(result.workstreams).toHaveLength(2);
        expect(result.workstreams[0]?.priority).toEqual('p0');
        expect(result.workstreams[0]?.rank).toEqual('r1');
        expect(result.workstreams[1]?.priority).toEqual('p5');
        expect(result.workstreams[1]?.rank).toEqual('r2');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case4] output artifacts', () => {
    when('[t0] coordinating behaviors', () => {
      then('writes coordination.md to output', async () => {
        const tempDir = path.join(os.tmpdir(), `test-coord-${Date.now()}-4`);
        await fs.mkdir(tempDir, { recursive: true });

        const triagedBasket = [
          mockTriaged({ name: 'feature-a', priority: 'p1', decision: 'now' }),
        ];
        const deptracedBasket = [mockDeptraced({ name: 'feature-a' })];

        await getAllBehaviorCoordinated(
          { triagedBasket, deptracedBasket },
          mockContext({ outputDir: tempDir }) as any,
        );

        const coordMdPath = path.join(tempDir, 'coordination.md');
        const coordMd = await fs.readFile(coordMdPath, 'utf-8');
        expect(coordMd).toContain('# coordination');

        await fs.rm(tempDir, { recursive: true });
      });
    });

    when('[t1] coordinating behaviors', () => {
      then('writes coordination.json to output', async () => {
        const tempDir = path.join(os.tmpdir(), `test-coord-${Date.now()}-5`);
        await fs.mkdir(tempDir, { recursive: true });

        const triagedBasket = [
          mockTriaged({ name: 'feature-a', priority: 'p1', decision: 'now' }),
        ];
        const deptracedBasket = [mockDeptraced({ name: 'feature-a' })];

        await getAllBehaviorCoordinated(
          { triagedBasket, deptracedBasket },
          mockContext({ outputDir: tempDir }) as any,
        );

        const coordJsonPath = path.join(tempDir, 'coordination.json');
        const coordJson = JSON.parse(await fs.readFile(coordJsonPath, 'utf-8'));
        expect(coordJson).toHaveLength(1);
        expect(coordJson[0].priority).toEqual('p1');

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });

  given('[case5] empty baskets', () => {
    when('[t0] no behaviors to coordinate', () => {
      then('returns empty workstreams', async () => {
        const tempDir = path.join(os.tmpdir(), `test-coord-${Date.now()}-6`);
        await fs.mkdir(tempDir, { recursive: true });

        const result = await getAllBehaviorCoordinated(
          { triagedBasket: [], deptracedBasket: [] },
          mockContext({ outputDir: tempDir }) as any,
        );

        expect(result.workstreams).toEqual([]);
        expect(result.stats).toEqual({ workstreams: 0, deliverables: 0 });

        await fs.rm(tempDir, { recursive: true });
      });
    });
  });
});
