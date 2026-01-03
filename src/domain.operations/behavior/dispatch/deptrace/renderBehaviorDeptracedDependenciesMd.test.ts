import { given, then, when } from 'test-fns';

import { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { renderBehaviorDeptracedDependenciesMd } from './renderBehaviorDeptracedDependenciesMd';

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

describe('renderBehaviorDeptracedDependenciesMd', () => {
  given('[case1] behaviors with no dependencies', () => {
    when('[t0] rendering dependencies markdown', () => {
      then('indicates no dependencies', () => {
        const deptraced = [mockDeptraced({ name: 'feature-a' })];
        const basket = [mockGathered({ name: 'feature-a' })];

        const result = renderBehaviorDeptracedDependenciesMd({
          deptraced,
          basket,
        });

        expect(result).toContain('# behavior dependencies');
        expect(result).toContain('feature-a');
        expect(result).toContain('no dependencies');
      });
    });
  });

  given('[case2] behaviors with direct dependencies', () => {
    when('[t0] rendering dependencies markdown', () => {
      then('lists direct dependencies', () => {
        const deptraced = [
          mockDeptraced({ name: 'feature-a' }),
          mockDeptraced({
            name: 'feature-b',
            directDeps: ['feature-a'],
            transitiveDeps: ['feature-a'],
          }),
        ];
        const basket = [
          mockGathered({ name: 'feature-a' }),
          mockGathered({ name: 'feature-b' }),
        ];

        const result = renderBehaviorDeptracedDependenciesMd({
          deptraced,
          basket,
        });

        expect(result).toContain('feature-b');
        expect(result).toContain('direct dependencies');
        expect(result).toContain('feature-a');
      });
    });
  });

  given('[case3] behaviors with transitive dependencies', () => {
    when('[t0] rendering markdown with transitive deps', () => {
      then('shows transitive dependencies separately', () => {
        const deptraced = [
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
        const basket = [
          mockGathered({ name: 'feature-a' }),
          mockGathered({ name: 'feature-b' }),
          mockGathered({ name: 'feature-c' }),
        ];

        const result = renderBehaviorDeptracedDependenciesMd({
          deptraced,
          basket,
        });

        expect(result).toContain('transitive dependencies');
      });
    });
  });

  given('[case4] summary statistics', () => {
    when('[t0] rendering with multiple behaviors', () => {
      then('includes summary stats', () => {
        const deptraced = [
          mockDeptraced({ name: 'feature-a' }),
          mockDeptraced({
            name: 'feature-b',
            directDeps: ['feature-a'],
            transitiveDeps: ['feature-a'],
          }),
        ];
        const basket = [
          mockGathered({ name: 'feature-a' }),
          mockGathered({ name: 'feature-b' }),
        ];

        const result = renderBehaviorDeptracedDependenciesMd({
          deptraced,
          basket,
        });

        expect(result).toContain('## summary');
        expect(result).toContain('total behaviors: 2');
      });
    });
  });

  given('[case5] reverse dependencies section', () => {
    when('[t0] behavior is depended on by others', () => {
      then('lists reverse dependencies', () => {
        const deptraced = [
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
        const basket = [
          mockGathered({ name: 'feature-a' }),
          mockGathered({ name: 'feature-b' }),
          mockGathered({ name: 'feature-c' }),
        ];

        const result = renderBehaviorDeptracedDependenciesMd({
          deptraced,
          basket,
        });

        expect(result).toContain('## reverse dependencies');
        expect(result).toContain('feature-a');
        expect(result).toContain('is depended on by');
      });
    });
  });
});
