import { given, then, when } from 'test-fns';

import { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { computeBehaviorTriagedReadiness } from './computeBehaviorTriagedReadiness';

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

describe('computeBehaviorTriagedReadiness', () => {
  given('[case1] behavior with no dependencies', () => {
    when('[t0] behavior has empty dependency list', () => {
      then('readiness is "now"', () => {
        const deptraced = mockDeptraced({
          name: 'feature-a',
          directDeps: [],
          transitiveDeps: [],
        });

        const result = computeBehaviorTriagedReadiness({
          deptraced,
          deliveredBehaviorNames: new Set(),
        });

        expect(result).toEqual('now');
      });
    });
  });

  given('[case2] behavior with all dependencies delivered', () => {
    when('[t0] all direct dependencies are delivered', () => {
      then('readiness is "now"', () => {
        const deptraced = mockDeptraced({
          name: 'feature-b',
          directDeps: ['feature-a'],
          transitiveDeps: ['feature-a'],
        });

        const result = computeBehaviorTriagedReadiness({
          deptraced,
          deliveredBehaviorNames: new Set(['feature-a']),
        });

        expect(result).toEqual('now');
      });
    });
  });

  given('[case3] behavior with undelivered direct dependencies', () => {
    when('[t0] direct dependency not yet delivered', () => {
      then('readiness is "soon"', () => {
        const deptraced = mockDeptraced({
          name: 'feature-b',
          directDeps: ['feature-a'],
          transitiveDeps: ['feature-a'],
        });

        const result = computeBehaviorTriagedReadiness({
          deptraced,
          deliveredBehaviorNames: new Set(), // nothing delivered
        });

        expect(result).toEqual('soon');
      });
    });
  });

  given('[case4] behavior with undelivered transitive dependencies', () => {
    when('[t0] transitive dependency (2+ hops) not delivered', () => {
      then('readiness is "later"', () => {
        // C depends on B depends on A (transitive)
        const deptraced = mockDeptraced({
          name: 'feature-c',
          directDeps: ['feature-b'],
          transitiveDeps: ['feature-b', 'feature-a'], // a is transitive only
        });

        const result = computeBehaviorTriagedReadiness({
          deptraced,
          deliveredBehaviorNames: new Set(), // nothing delivered
        });

        expect(result).toEqual('later');
      });
    });

    when('[t1] direct delivered but transitive not delivered', () => {
      then('readiness is "now" (direct deps are what matters)', () => {
        const deptraced = mockDeptraced({
          name: 'feature-c',
          directDeps: ['feature-b'],
          transitiveDeps: ['feature-b', 'feature-a'],
        });

        const result = computeBehaviorTriagedReadiness({
          deptraced,
          deliveredBehaviorNames: new Set(['feature-b']), // direct delivered
        });

        // direct deps are delivered, so we can start now
        // transitive deps are the direct deps' problem
        expect(result).toEqual('now');
      });
    });
  });

  given('[case5] partial delivery scenarios', () => {
    when('[t0] some but not all direct dependencies delivered', () => {
      then('readiness is "soon"', () => {
        const deptraced = mockDeptraced({
          name: 'feature-c',
          directDeps: ['feature-a', 'feature-b'],
          transitiveDeps: ['feature-a', 'feature-b'],
        });

        const result = computeBehaviorTriagedReadiness({
          deptraced,
          deliveredBehaviorNames: new Set(['feature-a']), // only a delivered
        });

        expect(result).toEqual('soon');
      });
    });
  });
});
