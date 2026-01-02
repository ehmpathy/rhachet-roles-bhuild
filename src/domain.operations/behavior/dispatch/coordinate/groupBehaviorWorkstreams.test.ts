import { given, then, when } from 'test-fns';

import { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { BehaviorTriaged } from '../../../../domain.objects/BehaviorTriaged';
import { groupBehaviorWorkstreams } from './groupBehaviorWorkstreams';

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
}): BehaviorDeptraced =>
  new BehaviorDeptraced({
    deptracedAt: new Date().toISOString(),
    gathered: mockGathered({ name: input.name }),
    dependsOnDirect: (input.directDeps ?? []).map((n) => ({
      behavior: { org: 'test', repo: 'repo', name: n },
      contentHash: `hash-${n}`,
    })),
    dependsOnTransitive: (input.directDeps ?? []).map((n) => ({
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
}): BehaviorTriaged =>
  new BehaviorTriaged({
    triagedAt: new Date().toISOString(),
    gathered: mockGathered({ name: input.name }),
    dimensions: { readiness: 'now', bandwidth: 'now' },
    decision: 'now',
    priority: input.priority,
  });

describe('groupBehaviorWorkstreams', () => {
  given('[case1] independent behaviors', () => {
    when('[t0] behaviors have no dependencies', () => {
      then('each behavior becomes its own workstream', () => {
        const triagedBasket = [
          mockTriaged({ name: 'feature-a', priority: 'p1' }),
          mockTriaged({ name: 'feature-b', priority: 'p3' }),
        ];
        const deptracedBasket = [
          mockDeptraced({ name: 'feature-a' }),
          mockDeptraced({ name: 'feature-b' }),
        ];

        const result = groupBehaviorWorkstreams({
          triagedBasket,
          deptracedBasket,
        });

        expect(result).toHaveLength(2);
      });
    });
  });

  given('[case2] linear dependency chain', () => {
    when('[t0] A <- B (B depends on A)', () => {
      then('both behaviors are in the same workstream', () => {
        const triagedBasket = [
          mockTriaged({ name: 'feature-a', priority: 'p1' }),
          mockTriaged({ name: 'feature-b', priority: 'p3' }),
        ];
        const deptracedBasket = [
          mockDeptraced({ name: 'feature-a' }),
          mockDeptraced({ name: 'feature-b', directDeps: ['feature-a'] }),
        ];

        const result = groupBehaviorWorkstreams({
          triagedBasket,
          deptracedBasket,
        });

        expect(result).toHaveLength(1);
        expect(result[0]?.deliverables).toHaveLength(2);
      });
    });
  });

  given('[case3] diamond dependency pattern', () => {
    when('[t0] A <- B, A <- C, B <- D, C <- D', () => {
      then('all behaviors merge into one workstream', () => {
        const triagedBasket = [
          mockTriaged({ name: 'feature-a', priority: 'p1' }),
          mockTriaged({ name: 'feature-b', priority: 'p3' }),
          mockTriaged({ name: 'feature-c', priority: 'p3' }),
          mockTriaged({ name: 'feature-d', priority: 'p5' }),
        ];
        const deptracedBasket = [
          mockDeptraced({ name: 'feature-a' }),
          mockDeptraced({ name: 'feature-b', directDeps: ['feature-a'] }),
          mockDeptraced({ name: 'feature-c', directDeps: ['feature-a'] }),
          mockDeptraced({
            name: 'feature-d',
            directDeps: ['feature-b', 'feature-c'],
          }),
        ];

        const result = groupBehaviorWorkstreams({
          triagedBasket,
          deptracedBasket,
        });

        expect(result).toHaveLength(1);
        expect(result[0]?.deliverables).toHaveLength(4);
      });
    });
  });

  given('[case4] mixed independent and dependent behaviors', () => {
    when('[t0] some behaviors are connected, others are not', () => {
      then('creates separate workstreams for each component', () => {
        const triagedBasket = [
          mockTriaged({ name: 'feature-a', priority: 'p1' }),
          mockTriaged({ name: 'feature-b', priority: 'p3' }),
          mockTriaged({ name: 'feature-x', priority: 'p0' }),
        ];
        const deptracedBasket = [
          mockDeptraced({ name: 'feature-a' }),
          mockDeptraced({ name: 'feature-b', directDeps: ['feature-a'] }),
          mockDeptraced({ name: 'feature-x' }), // independent
        ];

        const result = groupBehaviorWorkstreams({
          triagedBasket,
          deptracedBasket,
        });

        expect(result).toHaveLength(2);
      });
    });
  });

  given('[case5] workstream priority inheritance', () => {
    when('[t0] workstream contains behaviors of different priorities', () => {
      then('workstream inherits highest priority', () => {
        const triagedBasket = [
          mockTriaged({ name: 'feature-a', priority: 'p0' }), // critical
          mockTriaged({ name: 'feature-b', priority: 'p5' }), // low
        ];
        const deptracedBasket = [
          mockDeptraced({ name: 'feature-a' }),
          mockDeptraced({ name: 'feature-b', directDeps: ['feature-a'] }),
        ];

        const result = groupBehaviorWorkstreams({
          triagedBasket,
          deptracedBasket,
        });

        expect(result).toHaveLength(1);
        expect(result[0]?.priority).toEqual('p0');
      });
    });
  });
});
