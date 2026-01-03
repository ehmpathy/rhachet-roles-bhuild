import type { RefByUnique } from 'domain-objects';

import type { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import type { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';

/**
 * .what = computes reverse dependencies for a behavior
 * .why = behaviors that unblock many others have higher leverage
 *
 * reverse deps = behaviors that depend on this behavior
 */
export const computeBehaviorMeasuredReverseDeps = (input: {
  gathered: BehaviorGathered;
  deptracedBasket: BehaviorDeptraced[];
}): {
  direct: RefByUnique<typeof BehaviorGathered>[];
  transitive: RefByUnique<typeof BehaviorGathered>[];
} => {
  const behaviorName = input.gathered.behavior.name;
  const direct: RefByUnique<typeof BehaviorGathered>[] = [];
  const transitive: RefByUnique<typeof BehaviorGathered>[] = [];

  // find behaviors that directly depend on this one
  for (const deptraced of input.deptracedBasket) {
    const dependsOnThis = deptraced.dependsOnDirect.some(
      (dep) => dep.behavior.name === behaviorName,
    );

    if (dependsOnThis) {
      direct.push({
        behavior: deptraced.gathered.behavior,
        contentHash: deptraced.gathered.contentHash,
      });
    }
  }

  // find behaviors that transitively depend on this one
  for (const deptraced of input.deptracedBasket) {
    const transitivelyDependsOnThis = deptraced.dependsOnTransitive.some(
      (dep) => dep.behavior.name === behaviorName,
    );

    // only add if not already in direct
    const isAlreadyDirect = direct.some(
      (d) => d.behavior.name === deptraced.gathered.behavior.name,
    );

    if (transitivelyDependsOnThis && !isAlreadyDirect) {
      transitive.push({
        behavior: deptraced.gathered.behavior,
        contentHash: deptraced.gathered.contentHash,
      });
    }
  }

  return { direct, transitive };
};
