import { given, then, when } from 'test-fns';

import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { BehaviorWorkstream } from '../../../../domain.objects/BehaviorWorkstream';
import { BehaviorWorkstreamDeliverable } from '../../../../domain.objects/BehaviorWorkstreamDeliverable';
import { renderBehaviorWorkstreamCoordinationMd } from './renderBehaviorWorkstreamCoordinationMd';

/**
 * .what = creates a mock workstream for testing
 */
const mockWorkstream = (input: {
  slug: string;
  priority: 'p0' | 'p1' | 'p3' | 'p5';
  rank: string;
  deliverables: Array<{ name: string; decision: 'now' | 'soon' | 'later' }>;
}): BehaviorWorkstream =>
  new BehaviorWorkstream({
    slug: input.slug,
    name: `workstream-${input.slug}`,
    rank: input.rank as any,
    priority: input.priority,
    deliverables: input.deliverables.map(
      (d) =>
        new BehaviorWorkstreamDeliverable({
          gathered: new BehaviorGathered({
            gatheredAt: new Date().toISOString(),
            behavior: { org: 'test', repo: 'repo', name: d.name },
            contentHash: `hash-${d.name}`,
            status: 'wished',
            files: [],
            source: { type: 'repo.local' },
          }),
          priority: input.priority,
          decision: d.decision,
          effect: 0,
        }),
    ),
  });

describe('renderBehaviorWorkstreamCoordinationMd', () => {
  given('[case1] basic rendering', () => {
    when('[t0] rendering coordination markdown', () => {
      then('includes header and summary', () => {
        const workstreams = [
          mockWorkstream({
            slug: 'ws-1',
            priority: 'p1',
            rank: 'r1',
            deliverables: [{ name: 'feature-a', decision: 'now' }],
          }),
        ];

        const result = renderBehaviorWorkstreamCoordinationMd({ workstreams });

        expect(result).toContain('# coordination');
        expect(result).toContain('## summary');
        expect(result).toContain('total workstreams');
        expect(result).toContain('total deliverables');
      });
    });
  });

  given('[case2] priority distribution', () => {
    when('[t0] workstreams of different priorities', () => {
      then('shows priority distribution', () => {
        const workstreams = [
          mockWorkstream({
            slug: 'ws-1',
            priority: 'p0',
            rank: 'r1',
            deliverables: [{ name: 'critical', decision: 'now' }],
          }),
          mockWorkstream({
            slug: 'ws-2',
            priority: 'p1',
            rank: 'r2',
            deliverables: [{ name: 'high', decision: 'now' }],
          }),
          mockWorkstream({
            slug: 'ws-3',
            priority: 'p3',
            rank: 'r3',
            deliverables: [{ name: 'medium', decision: 'now' }],
          }),
        ];

        const result = renderBehaviorWorkstreamCoordinationMd({ workstreams });

        expect(result).toContain('priority distribution');
        expect(result).toContain('🔴 p0 (critical)');
        expect(result).toContain('🟠 p1 (high)');
        expect(result).toContain('🟡 p3 (medium)');
      });
    });
  });

  given('[case3] workstream details', () => {
    when('[t0] rendering workstream with deliverables', () => {
      then('lists deliverables with decision tags', () => {
        const workstreams = [
          mockWorkstream({
            slug: 'ws-1',
            priority: 'p1',
            rank: 'r1',
            deliverables: [
              { name: 'feature-a', decision: 'now' },
              { name: 'feature-b', decision: 'soon' },
            ],
          }),
        ];

        const result = renderBehaviorWorkstreamCoordinationMd({ workstreams });

        expect(result).toContain('## rank r1');
        expect(result).toContain('feature-a');
        expect(result).toContain('feature-b');
        expect(result).toContain('[now]');
      });
    });
  });

  given('[case4] bottlenecks section', () => {
    when('[t0] workstream has blocked deliverables', () => {
      then('lists bottlenecks', () => {
        const workstreams = [
          mockWorkstream({
            slug: 'ws-1',
            priority: 'p1',
            rank: 'r1',
            deliverables: [
              { name: 'feature-a', decision: 'now' },
              { name: 'feature-b', decision: 'soon' },
            ],
          }),
        ];

        const result = renderBehaviorWorkstreamCoordinationMd({ workstreams });

        expect(result).toContain('## bottlenecks');
      });
    });

    when('[t1] no bottlenecks exist', () => {
      then('indicates no bottlenecks', () => {
        const workstreams = [
          mockWorkstream({
            slug: 'ws-1',
            priority: 'p1',
            rank: 'r1',
            deliverables: [{ name: 'feature-a', decision: 'now' }],
          }),
        ];

        const result = renderBehaviorWorkstreamCoordinationMd({ workstreams });

        expect(result).toContain('no bottlenecks detected');
      });
    });
  });

  given('[case5] review order section', () => {
    when('[t0] multiple workstreams', () => {
      then('lists review order by rank', () => {
        const workstreams = [
          mockWorkstream({
            slug: 'ws-1',
            priority: 'p0',
            rank: 'r1',
            deliverables: [{ name: 'a', decision: 'now' }],
          }),
          mockWorkstream({
            slug: 'ws-2',
            priority: 'p1',
            rank: 'r2',
            deliverables: [{ name: 'b', decision: 'now' }],
          }),
        ];

        const result = renderBehaviorWorkstreamCoordinationMd({ workstreams });

        expect(result).toContain('## review order');
        expect(result).toContain('r1');
        expect(result).toContain('r2');
      });
    });
  });

  given('[case6] empty workstreams', () => {
    when('[t0] no workstreams provided', () => {
      then('renders with zero counts', () => {
        const result = renderBehaviorWorkstreamCoordinationMd({
          workstreams: [],
        });

        expect(result).toContain('# coordination');
        expect(result).toContain('total workstreams**: 0');
        expect(result).toContain('total deliverables**: 0');
      });
    });
  });
});
