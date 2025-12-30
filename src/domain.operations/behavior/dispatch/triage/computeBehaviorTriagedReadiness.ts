import type { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import type { BehaviorTriagedUrgencyLevel } from '../../../../domain.objects/BehaviorTriaged';

/**
 * .what = computes readiness urgency for a behavior
 * .why = behaviors blocked by many dependencies cannot start immediately
 *
 * readiness levels:
 * - now: unblocked (no dependencies or all deps delivered)
 * - soon: blocked by 1 hop (direct deps not yet delivered)
 * - later: blocked by 2+ hops (transitive deps not yet delivered)
 */
export const computeBehaviorTriagedReadiness = (input: {
  deptraced: BehaviorDeptraced;
  deliveredBehaviorNames: Set<string>;
}): BehaviorTriagedUrgencyLevel => {
  const { deptraced, deliveredBehaviorNames } = input;

  // check if behavior has any dependencies
  if (deptraced.dependsOnDirect.length === 0) {
    return 'now'; // no dependencies = fully ready
  }

  // check if all direct dependencies are delivered
  const allDirectDelivered = deptraced.dependsOnDirect.every((dep) =>
    deliveredBehaviorNames.has(dep.behavior.name),
  );

  if (allDirectDelivered) {
    return 'now'; // all direct deps delivered = ready
  }

  // check if there are undelivered transitive dependencies
  const hasUndeliveredTransitive = deptraced.dependsOnTransitive.some(
    (dep) =>
      !deliveredBehaviorNames.has(dep.behavior.name) &&
      !deptraced.dependsOnDirect.some(
        (d) => d.behavior.name === dep.behavior.name,
      ),
  );

  if (hasUndeliveredTransitive) {
    return 'later'; // blocked by 2+ hops
  }

  return 'soon'; // blocked by 1 hop (direct deps only)
};
