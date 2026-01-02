import { given, then, when } from 'test-fns';

import { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { computeBehaviorMeasuredReverseDeps } from './computeBehaviorMeasuredReverseDeps';

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

describe('computeBehaviorMeasuredReverseDeps', () => {
  given('[case1] behavior with no reverse dependencies', () => {
    when('[t0] no other behaviors depend on it', () => {
      then('returns empty arrays', () => {
        const gathered = mockGathered({ name: 'feature-a' });
        const deptracedBasket = [
          mockDeptraced({ name: 'feature-a' }),
          mockDeptraced({ name: 'feature-b' }),
        ];

        const result = computeBehaviorMeasuredReverseDeps({
          gathered,
          deptracedBasket,
        });

        expect(result.direct).toEqual([]);
        expect(result.transitive).toEqual([]);
      });
    });
  });

  given('[case2] behavior with direct reverse dependencies', () => {
    when('[t0] one behavior directly depends on it', () => {
      then('returns the direct dependent', () => {
        const gathered = mockGathered({ name: 'feature-a' });
        const deptracedBasket = [
          mockDeptraced({ name: 'feature-a' }),
          mockDeptraced({
            name: 'feature-b',
            directDeps: ['feature-a'],
            transitiveDeps: ['feature-a'],
          }),
        ];

        const result = computeBehaviorMeasuredReverseDeps({
          gathered,
          deptracedBasket,
        });

        expect(result.direct).toHaveLength(1);
        expect(result.direct[0]?.behavior.name).toEqual('feature-b');
        expect(result.transitive).toEqual([]);
      });
    });

    when('[t1] multiple behaviors directly depend on it', () => {
      then('returns all direct dependents', () => {
        const gathered = mockGathered({ name: 'feature-a' });
        const deptracedBasket = [
          mockDeptraced({ name: 'feature-a' }),
          mockDeptraced({
            name: 'feature-b',
            directDeps: ['feature-a'],
            transitiveDeps: ['feature-a'],
          }),
          mockDeptraced({
            name: 'feature-c',
            directDeps: ['feature-a'],
            transitiveDeps: ['feature-a'],
          }),
        ];

        const result = computeBehaviorMeasuredReverseDeps({
          gathered,
          deptracedBasket,
        });

        expect(result.direct).toHaveLength(2);
        expect(result.direct.map((d) => d.behavior.name).sort()).toEqual([
          'feature-b',
          'feature-c',
        ]);
      });
    });
  });

  given('[case3] behavior with transitive reverse dependencies', () => {
    when('[t0] behavior has both direct and transitive dependents', () => {
      then('separates direct from transitive', () => {
        // A <- B <- C (C transitively depends on A via B)
        const gathered = mockGathered({ name: 'feature-a' });
        const deptracedBasket = [
          mockDeptraced({ name: 'feature-a' }),
          mockDeptraced({
            name: 'feature-b',
            directDeps: ['feature-a'],
            transitiveDeps: ['feature-a'],
          }),
          mockDeptraced({
            name: 'feature-c',
            directDeps: ['feature-b'],
            transitiveDeps: ['feature-b', 'feature-a'],
          }),
        ];

        const result = computeBehaviorMeasuredReverseDeps({
          gathered,
          deptracedBasket,
        });

        // B directly depends on A
        expect(result.direct).toHaveLength(1);
        expect(result.direct[0]?.behavior.name).toEqual('feature-b');

        // C transitively depends on A (not direct, so in transitive)
        expect(result.transitive).toHaveLength(1);
        expect(result.transitive[0]?.behavior.name).toEqual('feature-c');
      });
    });
  });

  given('[case4] complex dependency graph', () => {
    when('[t0] diamond dependency pattern', () => {
      then('counts each dependent once in appropriate category', () => {
        // A <- B <- D
        // A <- C <- D (diamond: D depends on A through both B and C)
        const gathered = mockGathered({ name: 'feature-a' });
        const deptracedBasket = [
          mockDeptraced({ name: 'feature-a' }),
          mockDeptraced({
            name: 'feature-b',
            directDeps: ['feature-a'],
            transitiveDeps: ['feature-a'],
          }),
          mockDeptraced({
            name: 'feature-c',
            directDeps: ['feature-a'],
            transitiveDeps: ['feature-a'],
          }),
          mockDeptraced({
            name: 'feature-d',
            directDeps: ['feature-b', 'feature-c'],
            transitiveDeps: ['feature-b', 'feature-c', 'feature-a'],
          }),
        ];

        const result = computeBehaviorMeasuredReverseDeps({
          gathered,
          deptracedBasket,
        });

        // B and C directly depend on A
        expect(result.direct).toHaveLength(2);

        // D transitively depends on A (through B and C)
        expect(result.transitive).toHaveLength(1);
        expect(result.transitive[0]?.behavior.name).toEqual('feature-d');
      });
    });
  });
});
