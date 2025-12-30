import type { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import type { BehaviorMeasured } from '../../../../domain.objects/BehaviorMeasured';
import {
  BehaviorTriaged,
  type BehaviorTriagedUrgencyLevel,
} from '../../../../domain.objects/BehaviorTriaged';
import { computeBehaviorTriagedBandwidth } from './computeBehaviorTriagedBandwidth';
import { computeBehaviorTriagedReadiness } from './computeBehaviorTriagedReadiness';

/**
 * .what = triages all measured behaviors by readiness and bandwidth
 * .why = enables scheduling by combining priority with execution constraints
 *
 * decision = min(readiness, bandwidth)
 * - if readiness=now and bandwidth=now → now
 * - if readiness=soon or bandwidth=soon → soon
 * - if readiness=later or bandwidth=later → later
 */
export const getAllBehaviorTriaged = async (
  input: {
    measuredBasket: BehaviorMeasured[];
    deptracedBasket: BehaviorDeptraced[];
  },
  context: BehaviorDispatchContext,
): Promise<{
  behaviors: BehaviorTriaged[];
  stats: {
    now: number;
    soon: number;
    later: number;
    total: number;
  };
}> => {
  const maxConcurrency = context.config.constraints.maxConcurrency ?? 3;

  // rank measured by priority then effect
  const rankedMeasured = [...input.measuredBasket].sort((a, b) => {
    // first by priority level (p0 > p1 > p3 > p5)
    const priorityOrder = { p0: 0, p1: 1, p3: 2, p5: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // then by effect (higher = better)
    return b.effect - a.effect;
  });

  // collect delivered behavior names for readiness check
  const deliveredBehaviorNames = new Set<string>();
  for (const measured of input.measuredBasket) {
    // find the gathered status from deptraced
    const deptraced = input.deptracedBasket.find(
      (d) =>
        d.gathered.behavior.name === measured.gathered.behavior.name &&
        d.gathered.contentHash === measured.gathered.contentHash,
    );
    // note: we'll need to get status from original gathered basket
    // for now, we don't add any to delivered (conservative approach)
  }

  // triage each measured behavior
  const triaged: BehaviorTriaged[] = [];

  for (const measured of rankedMeasured) {
    // find corresponding deptraced
    const deptraced = input.deptracedBasket.find(
      (d) =>
        d.gathered.behavior.name === measured.gathered.behavior.name &&
        d.gathered.contentHash === measured.gathered.contentHash,
    );

    if (!deptraced) {
      context.log.warn('missing deptraced for measured behavior', {
        behavior: measured.gathered.behavior.name,
      });
      continue;
    }

    // compute readiness
    const readiness = computeBehaviorTriagedReadiness({
      deptraced,
      deliveredBehaviorNames,
    });

    // compute bandwidth
    const bandwidth = computeBehaviorTriagedBandwidth({
      measured,
      rankedMeasured,
      config: { maxConcurrency },
    });

    // decision = min(readiness, bandwidth)
    const decision = computeDecision({ readiness, bandwidth });

    // construct triaged entity
    const behavior = new BehaviorTriaged({
      triagedAt: new Date().toISOString(),
      gathered: measured.gathered,
      dimensions: { readiness, bandwidth },
      decision,
      priority: measured.priority,
    });

    triaged.push(behavior);
  }

  // compute stats
  const stats = {
    now: triaged.filter((t) => t.decision === 'now').length,
    soon: triaged.filter((t) => t.decision === 'soon').length,
    later: triaged.filter((t) => t.decision === 'later').length,
    total: triaged.length,
  };

  return { behaviors: triaged, stats };
};

/**
 * .what = computes final decision from readiness and bandwidth
 * .why = decision is the minimum urgency of the two dimensions
 */
const computeDecision = (input: {
  readiness: BehaviorTriagedUrgencyLevel;
  bandwidth: BehaviorTriagedUrgencyLevel;
}): BehaviorTriagedUrgencyLevel => {
  const urgencyOrder: Record<BehaviorTriagedUrgencyLevel, number> = {
    now: 0,
    soon: 1,
    later: 2,
  };

  // take the less urgent of the two (higher number = less urgent)
  const readinessOrder = urgencyOrder[input.readiness];
  const bandwidthOrder = urgencyOrder[input.bandwidth];

  const minOrder = Math.max(readinessOrder, bandwidthOrder);

  if (minOrder === 0) return 'now';
  if (minOrder === 1) return 'soon';
  return 'later';
};
