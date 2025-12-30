import type { BehaviorMeasured } from '../../../../domain.objects/BehaviorMeasured';
import type { BehaviorTriagedUrgencyLevel } from '../../../../domain.objects/BehaviorTriaged';

/**
 * .what = computes bandwidth urgency for a behavior
 * .why = limits concurrent work based on available capacity
 *
 * bandwidth levels:
 * - now: within top N by priority (can start immediately)
 * - soon: within 2N by priority (can start when slot opens)
 * - later: beyond 2N (wait for significant capacity)
 */
export const computeBehaviorTriagedBandwidth = (input: {
  measured: BehaviorMeasured;
  rankedMeasured: BehaviorMeasured[];
  config: {
    maxConcurrency: number;
  };
}): BehaviorTriagedUrgencyLevel => {
  const { measured, rankedMeasured, config } = input;

  // find position in ranked list
  const position = rankedMeasured.findIndex(
    (m) =>
      m.gathered.behavior.name === measured.gathered.behavior.name &&
      m.gathered.contentHash === measured.gathered.contentHash,
  );

  // not found = later
  if (position === -1) return 'later';

  // within top N = now
  if (position < config.maxConcurrency) {
    return 'now';
  }

  // within 2N = soon
  if (position < config.maxConcurrency * 2) {
    return 'soon';
  }

  // beyond 2N = later
  return 'later';
};
