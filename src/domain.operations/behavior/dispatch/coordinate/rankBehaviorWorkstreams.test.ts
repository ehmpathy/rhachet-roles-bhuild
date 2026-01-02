import { given, then, when } from 'test-fns';

import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { BehaviorWorkstream } from '../../../../domain.objects/BehaviorWorkstream';
import { BehaviorWorkstreamDeliverable } from '../../../../domain.objects/BehaviorWorkstreamDeliverable';
import { rankBehaviorWorkstreams } from './rankBehaviorWorkstreams';

/**
 * .what = creates a mock workstream for testing
 */
const mockWorkstream = (input: {
  slug: string;
  priority: 'p0' | 'p1' | 'p3' | 'p5';
  deliverableCount: number;
}): BehaviorWorkstream =>
  new BehaviorWorkstream({
    slug: input.slug,
    name: `workstream-${input.slug}`,
    rank: 'r1',
    priority: input.priority,
    deliverables: Array.from(
      { length: input.deliverableCount },
      (_, i) =>
        new BehaviorWorkstreamDeliverable({
          gathered: new BehaviorGathered({
            gatheredAt: new Date().toISOString(),
            behavior: { org: 'test', repo: 'repo', name: `${input.slug}-${i}` },
            contentHash: `hash-${input.slug}-${i}`,
            status: 'wished',
            files: [],
            source: { type: 'repo.local' },
          }),
          priority: input.priority,
          decision: 'now',
          effect: 0,
        }),
    ),
  });

describe('rankBehaviorWorkstreams', () => {
  given('[case1] workstreams with different priorities', () => {
    when('[t0] ranking workstreams by priority', () => {
      then('higher priority workstreams rank first', () => {
        const workstreams = [
          mockWorkstream({
            slug: 'ws-low',
            priority: 'p5',
            deliverableCount: 1,
          }),
          mockWorkstream({
            slug: 'ws-critical',
            priority: 'p0',
            deliverableCount: 1,
          }),
          mockWorkstream({
            slug: 'ws-medium',
            priority: 'p3',
            deliverableCount: 1,
          }),
        ];

        const result = rankBehaviorWorkstreams({ workstreams });

        expect(result[0]?.priority).toEqual('p0');
        expect(result[0]?.rank).toEqual('r1');
        expect(result[1]?.priority).toEqual('p3');
        expect(result[1]?.rank).toEqual('r2');
        expect(result[2]?.priority).toEqual('p5');
        expect(result[2]?.rank).toEqual('r3');
      });
    });
  });

  given('[case2] workstreams with same priority', () => {
    when('[t0] same priority but different deliverable counts', () => {
      then('workstream with more deliverables ranks higher', () => {
        const workstreams = [
          mockWorkstream({
            slug: 'ws-small',
            priority: 'p1',
            deliverableCount: 1,
          }),
          mockWorkstream({
            slug: 'ws-large',
            priority: 'p1',
            deliverableCount: 5,
          }),
          mockWorkstream({
            slug: 'ws-medium',
            priority: 'p1',
            deliverableCount: 3,
          }),
        ];

        const result = rankBehaviorWorkstreams({ workstreams });

        expect(result[0]?.slug).toEqual('ws-large');
        expect(result[0]?.rank).toEqual('r1');
        expect(result[1]?.slug).toEqual('ws-medium');
        expect(result[1]?.rank).toEqual('r2');
        expect(result[2]?.slug).toEqual('ws-small');
        expect(result[2]?.rank).toEqual('r3');
      });
    });
  });

  given('[case3] mixed priority and size', () => {
    when('[t0] priority takes precedence over size', () => {
      then('higher priority wins even with fewer deliverables', () => {
        const workstreams = [
          mockWorkstream({
            slug: 'ws-big-low',
            priority: 'p5',
            deliverableCount: 10,
          }),
          mockWorkstream({
            slug: 'ws-small-critical',
            priority: 'p0',
            deliverableCount: 1,
          }),
        ];

        const result = rankBehaviorWorkstreams({ workstreams });

        expect(result[0]?.slug).toEqual('ws-small-critical');
        expect(result[1]?.slug).toEqual('ws-big-low');
      });
    });
  });

  given('[case4] empty workstreams list', () => {
    when('[t0] no workstreams provided', () => {
      then('returns empty array', () => {
        const result = rankBehaviorWorkstreams({ workstreams: [] });

        expect(result).toEqual([]);
      });
    });
  });

  given('[case5] single workstream', () => {
    when('[t0] only one workstream', () => {
      then('assigns rank r1', () => {
        const workstreams = [
          mockWorkstream({
            slug: 'ws-only',
            priority: 'p3',
            deliverableCount: 2,
          }),
        ];

        const result = rankBehaviorWorkstreams({ workstreams });

        expect(result).toHaveLength(1);
        expect(result[0]?.rank).toEqual('r1');
      });
    });
  });
});
