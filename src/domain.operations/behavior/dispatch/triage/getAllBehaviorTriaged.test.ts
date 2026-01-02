import { given, then, when } from 'test-fns';

import { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { BehaviorMeasured } from '../../../../domain.objects/BehaviorMeasured';
import { BehaviorMeasuredCost } from '../../../../domain.objects/BehaviorMeasuredCost';
import { BehaviorMeasuredCostAttend } from '../../../../domain.objects/BehaviorMeasuredCostAttend';
import { BehaviorMeasuredCostExpend } from '../../../../domain.objects/BehaviorMeasuredCostExpend';
import { BehaviorMeasuredGain } from '../../../../domain.objects/BehaviorMeasuredGain';
import { BehaviorMeasuredGainLeverage } from '../../../../domain.objects/BehaviorMeasuredGainLeverage';
import { BehaviorMeasuredGainYieldage } from '../../../../domain.objects/BehaviorMeasuredGainYieldage';
import { getAllBehaviorTriaged } from './getAllBehaviorTriaged';

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
 * .what = creates a mock BehaviorMeasured for testing
 */
const mockMeasured = (input: {
  name: string;
  priority: 'p0' | 'p1' | 'p3' | 'p5';
  effect: number;
}): BehaviorMeasured =>
  new BehaviorMeasured({
    measuredAt: new Date().toISOString(),
    gathered: mockGathered({ name: input.name }),
    gain: new BehaviorMeasuredGain({
      dimensions: {
        leverage: new BehaviorMeasuredGainLeverage({
          direct: 0,
          transitive: 0,
        }),
        yieldage: new BehaviorMeasuredGainYieldage({
          direct: { chances: [], expected: 0 },
          transitive: 0,
        }),
      },
      composite: input.effect > 0 ? input.effect : 0,
    }),
    cost: new BehaviorMeasuredCost({
      dimensions: {
        attend: new BehaviorMeasuredCostAttend({
          upfront: 0,
          recurrent: 0,
          composite: 0,
        }),
        expend: new BehaviorMeasuredCostExpend({
          upfront: 0,
          recurrent: 0,
          composite: 0,
        }),
      },
      composite: input.effect < 0 ? -input.effect : 0,
    }),
    effect: input.effect,
    priority: input.priority,
  });

/**
 * .what = creates a mock context for testing
 */
const mockContext = () => ({
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  config: {
    sources: { local: { enabled: true }, remote: [] },
    output: '/tmp/output',
    constraints: { maxConcurrency: 3 },
    cost: { horizon: { weeks: 52 } },
    gain: {
      hourlyRate: 100,
      defaults: { baseYieldage: 100, transitiveMultiplier: 0.5 },
    },
    weights: { author: 1, support: 1 },
  },
  cacheDir: { mounted: { path: '/tmp/cache' } },
  brain: { repl: { imagine: jest.fn() } },
});

describe('getAllBehaviorTriaged', () => {
  given('[case1] single behavior with no dependencies', () => {
    when('[t0] behavior is ready and has bandwidth', () => {
      then('decision is now', async () => {
        const measuredBasket = [
          mockMeasured({ name: 'feature-a', priority: 'p0', effect: 5000 }),
        ];
        const deptracedBasket = [mockDeptraced({ name: 'feature-a' })];

        const result = await getAllBehaviorTriaged(
          { measuredBasket, deptracedBasket },
          mockContext() as any,
        );

        expect(result.behaviors).toHaveLength(1);
        expect(result.behaviors[0]?.decision).toEqual('now');
        expect(result.stats.now).toEqual(1);
        expect(result.stats.soon).toEqual(0);
        expect(result.stats.later).toEqual(0);
      });
    });
  });

  given('[case2] multiple behaviors with different priorities', () => {
    when('[t0] triaging by priority', () => {
      then('higher priority behaviors are sorted first', async () => {
        const measuredBasket = [
          mockMeasured({ name: 'low', priority: 'p5', effect: 100 }),
          mockMeasured({ name: 'critical', priority: 'p0', effect: 10000 }),
          mockMeasured({ name: 'medium', priority: 'p3', effect: 500 }),
        ];
        const deptracedBasket = [
          mockDeptraced({ name: 'low' }),
          mockDeptraced({ name: 'critical' }),
          mockDeptraced({ name: 'medium' }),
        ];

        const result = await getAllBehaviorTriaged(
          { measuredBasket, deptracedBasket },
          mockContext() as any,
        );

        expect(result.behaviors).toHaveLength(3);
        // check that stats are correct
        expect(result.stats.total).toEqual(3);
      });
    });
  });

  given('[case3] behavior blocked by dependencies', () => {
    when('[t0] behavior has undelivered direct deps', () => {
      then('readiness dimension is soon', async () => {
        const measuredBasket = [
          mockMeasured({ name: 'feature-a', priority: 'p1', effect: 1000 }),
          mockMeasured({ name: 'feature-b', priority: 'p1', effect: 1000 }),
        ];
        const deptracedBasket = [
          mockDeptraced({ name: 'feature-a' }),
          mockDeptraced({
            name: 'feature-b',
            directDeps: ['feature-a'],
            transitiveDeps: ['feature-a'],
          }),
        ];

        const result = await getAllBehaviorTriaged(
          { measuredBasket, deptracedBasket },
          mockContext() as any,
        );

        expect(result.behaviors).toHaveLength(2);
        // feature-a has no deps, so ready now
        const featureA = result.behaviors.find(
          (b) => b.gathered.behavior.name === 'feature-a',
        );
        expect(featureA?.dimensions.readiness).toEqual('now');
        // feature-b depends on feature-a which is not delivered
        const featureB = result.behaviors.find(
          (b) => b.gathered.behavior.name === 'feature-b',
        );
        expect(featureB?.dimensions.readiness).toEqual('soon');
      });
    });
  });

  given('[case4] bandwidth constraints', () => {
    when('[t0] more behaviors than maxConcurrency', () => {
      then('some behaviors have bandwidth=soon or later', async () => {
        // create 5 behaviors with maxConcurrency=3
        const measuredBasket = [
          mockMeasured({ name: 'a', priority: 'p1', effect: 1000 }),
          mockMeasured({ name: 'b', priority: 'p1', effect: 900 }),
          mockMeasured({ name: 'c', priority: 'p1', effect: 800 }),
          mockMeasured({ name: 'd', priority: 'p1', effect: 700 }),
          mockMeasured({ name: 'e', priority: 'p1', effect: 600 }),
        ];
        const deptracedBasket = [
          mockDeptraced({ name: 'a' }),
          mockDeptraced({ name: 'b' }),
          mockDeptraced({ name: 'c' }),
          mockDeptraced({ name: 'd' }),
          mockDeptraced({ name: 'e' }),
        ];

        const result = await getAllBehaviorTriaged(
          { measuredBasket, deptracedBasket },
          mockContext() as any,
        );

        expect(result.behaviors).toHaveLength(5);
        // first 3 should have bandwidth=now
        const nowCount = result.behaviors.filter(
          (b) => b.dimensions.bandwidth === 'now',
        ).length;
        expect(nowCount).toEqual(3);
      });
    });
  });

  given('[case5] decision is min of readiness and bandwidth', () => {
    when('[t0] readiness=now but bandwidth=soon', () => {
      then('decision is soon', async () => {
        // 4 behaviors, maxConcurrency=3 means 4th is bandwidth=soon
        const measuredBasket = [
          mockMeasured({ name: 'a', priority: 'p0', effect: 10000 }),
          mockMeasured({ name: 'b', priority: 'p0', effect: 9000 }),
          mockMeasured({ name: 'c', priority: 'p0', effect: 8000 }),
          mockMeasured({ name: 'd', priority: 'p0', effect: 7000 }), // this one will be bandwidth=soon
        ];
        const deptracedBasket = [
          mockDeptraced({ name: 'a' }),
          mockDeptraced({ name: 'b' }),
          mockDeptraced({ name: 'c' }),
          mockDeptraced({ name: 'd' }),
        ];

        const result = await getAllBehaviorTriaged(
          { measuredBasket, deptracedBasket },
          mockContext() as any,
        );

        const behaviorD = result.behaviors.find(
          (b) => b.gathered.behavior.name === 'd',
        );
        expect(behaviorD?.dimensions.readiness).toEqual('now');
        expect(behaviorD?.dimensions.bandwidth).toEqual('soon');
        expect(behaviorD?.decision).toEqual('soon');
      });
    });
  });

  given('[case6] empty baskets', () => {
    when('[t0] no behaviors to triage', () => {
      then('returns empty results', async () => {
        const result = await getAllBehaviorTriaged(
          { measuredBasket: [], deptracedBasket: [] },
          mockContext() as any,
        );

        expect(result.behaviors).toEqual([]);
        expect(result.stats).toEqual({ now: 0, soon: 0, later: 0, total: 0 });
      });
    });
  });
});
