import { given, then, when } from 'test-fns';

import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { BehaviorMeasured } from '../../../../domain.objects/BehaviorMeasured';
import { BehaviorMeasuredCost } from '../../../../domain.objects/BehaviorMeasuredCost';
import { BehaviorMeasuredCostAttend } from '../../../../domain.objects/BehaviorMeasuredCostAttend';
import { BehaviorMeasuredCostExpend } from '../../../../domain.objects/BehaviorMeasuredCostExpend';
import { BehaviorMeasuredGain } from '../../../../domain.objects/BehaviorMeasuredGain';
import { BehaviorMeasuredGainLeverage } from '../../../../domain.objects/BehaviorMeasuredGainLeverage';
import { BehaviorMeasuredGainYieldage } from '../../../../domain.objects/BehaviorMeasuredGainYieldage';
import { BehaviorTriaged } from '../../../../domain.objects/BehaviorTriaged';
import { renderBehaviorTriagedPrioritizationMd } from './renderBehaviorTriagedPrioritizationMd';

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
 * .what = creates a mock BehaviorMeasured for testing
 */
const mockMeasured = (input: {
  name: string;
  gain: number;
  cost: number;
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
      composite: input.gain,
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
      composite: input.cost,
    }),
    effect: input.gain - input.cost,
    priority: 'p3',
  });

describe('renderBehaviorTriagedPrioritizationMd', () => {
  given('[case1] basic rendering', () => {
    when('[t0] rendering prioritization markdown', () => {
      then('includes header and summary', () => {
        const triaged = [
          mockTriaged({ name: 'feature-a', priority: 'p1', decision: 'now' }),
        ];
        const measured = [
          mockMeasured({ name: 'feature-a', gain: 1000, cost: 100 }),
        ];

        const result = renderBehaviorTriagedPrioritizationMd({
          triaged,
          measured,
          stats: { now: 1, soon: 0, later: 0, total: 1 },
        });

        expect(result).toContain('# prioritization');
        expect(result).toContain('## summary');
        expect(result).toContain('total behaviors');
      });
    });
  });

  given('[case2] now section', () => {
    when('[t0] behaviors with decision "now"', () => {
      then('renders now section with behaviors', () => {
        const triaged = [
          mockTriaged({ name: 'feature-a', priority: 'p0', decision: 'now' }),
        ];
        const measured = [
          mockMeasured({ name: 'feature-a', gain: 5000, cost: 500 }),
        ];

        const result = renderBehaviorTriagedPrioritizationMd({
          triaged,
          measured,
          stats: { now: 1, soon: 0, later: 0, total: 1 },
        });

        expect(result).toContain('## 🚀 now');
        expect(result).toContain('feature-a');
      });
    });
  });

  given('[case3] soon section', () => {
    when('[t0] behaviors with decision "soon"', () => {
      then('renders soon section with behaviors', () => {
        const triaged = [
          mockTriaged({ name: 'feature-b', priority: 'p1', decision: 'soon' }),
        ];
        const measured = [
          mockMeasured({ name: 'feature-b', gain: 2000, cost: 200 }),
        ];

        const result = renderBehaviorTriagedPrioritizationMd({
          triaged,
          measured,
          stats: { now: 0, soon: 1, later: 0, total: 1 },
        });

        expect(result).toContain('## ⏳ soon');
        expect(result).toContain('feature-b');
      });
    });
  });

  given('[case4] later section', () => {
    when('[t0] behaviors with decision "later"', () => {
      then('renders later section with behaviors', () => {
        const triaged = [
          mockTriaged({ name: 'feature-c', priority: 'p5', decision: 'later' }),
        ];
        const measured = [
          mockMeasured({ name: 'feature-c', gain: 100, cost: 50 }),
        ];

        const result = renderBehaviorTriagedPrioritizationMd({
          triaged,
          measured,
          stats: { now: 0, soon: 0, later: 1, total: 1 },
        });

        expect(result).toContain('## 📅 later');
        expect(result).toContain('feature-c');
      });
    });
  });

  given('[case5] priority emojis', () => {
    when('[t0] different priority levels', () => {
      then('shows appropriate emoji for each priority', () => {
        const triaged = [
          mockTriaged({ name: 'critical', priority: 'p0', decision: 'now' }),
          mockTriaged({ name: 'high', priority: 'p1', decision: 'now' }),
          mockTriaged({ name: 'medium', priority: 'p3', decision: 'now' }),
          mockTriaged({ name: 'low', priority: 'p5', decision: 'now' }),
        ];
        const measured = [
          mockMeasured({ name: 'critical', gain: 10000, cost: 100 }),
          mockMeasured({ name: 'high', gain: 5000, cost: 100 }),
          mockMeasured({ name: 'medium', gain: 1000, cost: 100 }),
          mockMeasured({ name: 'low', gain: 100, cost: 10 }),
        ];

        const result = renderBehaviorTriagedPrioritizationMd({
          triaged,
          measured,
          stats: { now: 4, soon: 0, later: 0, total: 4 },
        });

        expect(result).toContain('🔴'); // p0
        expect(result).toContain('🟠'); // p1
        expect(result).toContain('🟡'); // p3
        expect(result).toContain('🟢'); // p5
      });
    });
  });

  given('[case6] table formatting', () => {
    when('[t0] rendering behavior table', () => {
      then('includes all required columns', () => {
        const triaged = [
          mockTriaged({ name: 'feature-a', priority: 'p1', decision: 'now' }),
        ];
        const measured = [
          mockMeasured({ name: 'feature-a', gain: 1000, cost: 100 }),
        ];

        const result = renderBehaviorTriagedPrioritizationMd({
          triaged,
          measured,
          stats: { now: 1, soon: 0, later: 0, total: 1 },
        });

        expect(result).toContain('| behavior |');
        expect(result).toContain('| repo |');
        expect(result).toContain('| priority |');
        expect(result).toContain('gain');
        expect(result).toContain('cost');
        expect(result).toContain('effect');
      });
    });
  });
});
