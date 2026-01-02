import { given, then, when } from 'test-fns';

import { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { BehaviorMeasured } from '../../../../domain.objects/BehaviorMeasured';
import { BehaviorMeasuredCost } from '../../../../domain.objects/BehaviorMeasuredCost';
import { BehaviorMeasuredCostAttend } from '../../../../domain.objects/BehaviorMeasuredCostAttend';
import { BehaviorMeasuredCostExpend } from '../../../../domain.objects/BehaviorMeasuredCostExpend';
import { BehaviorMeasuredGain } from '../../../../domain.objects/BehaviorMeasuredGain';
import { BehaviorMeasuredGainLeverage } from '../../../../domain.objects/BehaviorMeasuredGainLeverage';
import { BehaviorMeasuredGainYieldage } from '../../../../domain.objects/BehaviorMeasuredGainYieldage';
import { computeBehaviorTriagedBandwidth } from './computeBehaviorTriagedBandwidth';

/**
 * .what = creates a mock BehaviorMeasured for testing
 */
const mockMeasured = (input: {
  name: string;
  effect: number;
}): BehaviorMeasured =>
  new BehaviorMeasured({
    measuredAt: new Date().toISOString(),
    gathered: new BehaviorGathered({
      gatheredAt: new Date().toISOString(),
      behavior: { org: 'test', repo: 'repo', name: input.name },
      contentHash: `hash-${input.name}`,
      status: 'wished',
      files: [],
      source: { type: 'repo.local' },
    }),
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
      composite: input.effect,
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
      composite: 0,
    }),
    effect: input.effect,
    priority: 'p3',
  });

describe('computeBehaviorTriagedBandwidth', () => {
  given('[case1] behavior within top N by priority', () => {
    when('[t0] behavior is at position 0 (first)', () => {
      then('bandwidth is "now"', () => {
        const measured = mockMeasured({ name: 'feature-a', effect: 1000 });
        const rankedMeasured = [
          mockMeasured({ name: 'feature-a', effect: 1000 }),
          mockMeasured({ name: 'feature-b', effect: 500 }),
          mockMeasured({ name: 'feature-c', effect: 100 }),
        ];

        const result = computeBehaviorTriagedBandwidth({
          measured,
          rankedMeasured,
          config: { maxConcurrency: 2 },
        });

        expect(result).toEqual('now');
      });
    });

    when('[t1] behavior is at position maxConcurrency - 1', () => {
      then('bandwidth is "now"', () => {
        const measured = mockMeasured({ name: 'feature-b', effect: 500 });
        const rankedMeasured = [
          mockMeasured({ name: 'feature-a', effect: 1000 }),
          mockMeasured({ name: 'feature-b', effect: 500 }),
          mockMeasured({ name: 'feature-c', effect: 100 }),
        ];

        const result = computeBehaviorTriagedBandwidth({
          measured,
          rankedMeasured,
          config: { maxConcurrency: 2 },
        });

        expect(result).toEqual('now');
      });
    });
  });

  given('[case2] behavior within 2N by priority', () => {
    when('[t0] behavior is at position maxConcurrency', () => {
      then('bandwidth is "soon"', () => {
        const measured = mockMeasured({ name: 'feature-c', effect: 100 });
        const rankedMeasured = [
          mockMeasured({ name: 'feature-a', effect: 1000 }),
          mockMeasured({ name: 'feature-b', effect: 500 }),
          mockMeasured({ name: 'feature-c', effect: 100 }),
          mockMeasured({ name: 'feature-d', effect: 50 }),
        ];

        const result = computeBehaviorTriagedBandwidth({
          measured,
          rankedMeasured,
          config: { maxConcurrency: 2 },
        });

        expect(result).toEqual('soon');
      });
    });

    when('[t1] behavior is at position 2*maxConcurrency - 1', () => {
      then('bandwidth is "soon"', () => {
        const measured = mockMeasured({ name: 'feature-d', effect: 50 });
        const rankedMeasured = [
          mockMeasured({ name: 'feature-a', effect: 1000 }),
          mockMeasured({ name: 'feature-b', effect: 500 }),
          mockMeasured({ name: 'feature-c', effect: 100 }),
          mockMeasured({ name: 'feature-d', effect: 50 }),
        ];

        const result = computeBehaviorTriagedBandwidth({
          measured,
          rankedMeasured,
          config: { maxConcurrency: 2 },
        });

        expect(result).toEqual('soon');
      });
    });
  });

  given('[case3] behavior beyond 2N by priority', () => {
    when('[t0] behavior is at position >= 2*maxConcurrency', () => {
      then('bandwidth is "later"', () => {
        const measured = mockMeasured({ name: 'feature-e', effect: 10 });
        const rankedMeasured = [
          mockMeasured({ name: 'feature-a', effect: 1000 }),
          mockMeasured({ name: 'feature-b', effect: 500 }),
          mockMeasured({ name: 'feature-c', effect: 100 }),
          mockMeasured({ name: 'feature-d', effect: 50 }),
          mockMeasured({ name: 'feature-e', effect: 10 }),
        ];

        const result = computeBehaviorTriagedBandwidth({
          measured,
          rankedMeasured,
          config: { maxConcurrency: 2 },
        });

        expect(result).toEqual('later');
      });
    });
  });

  given('[case4] behavior not found in ranked list', () => {
    when('[t0] measured not in rankedMeasured', () => {
      then('bandwidth is "later"', () => {
        const measured = mockMeasured({ name: 'feature-unknown', effect: 100 });
        const rankedMeasured = [
          mockMeasured({ name: 'feature-a', effect: 1000 }),
          mockMeasured({ name: 'feature-b', effect: 500 }),
        ];

        const result = computeBehaviorTriagedBandwidth({
          measured,
          rankedMeasured,
          config: { maxConcurrency: 2 },
        });

        expect(result).toEqual('later');
      });
    });
  });
});
