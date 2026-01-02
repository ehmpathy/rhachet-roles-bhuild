import { type RefByUnique, serialize } from 'domain-objects';

import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import type { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { parseBehaviorDeptracedDependencies } from './parseBehaviorDeptracedDependencies';

/**
 * .what = computes transitive closure of dependencies for a behavior
 * .why = enables full blocker chain visibility (A depends on B depends on C means A depends on both B and C)
 *
 * @note uses brain.repl via parseBehaviorDeptracedDependencies for inference
 */
export const computeBehaviorDeptracedTransitiveDeps = async (
  input: {
    gathered: BehaviorGathered;
    basket: BehaviorGathered[];
  },
  context: BehaviorDispatchContext,
): Promise<{
  direct: RefByUnique<typeof BehaviorGathered>[];
  transitive: RefByUnique<typeof BehaviorGathered>[];
  circular: boolean;
}> => {
  // get direct dependencies via brain.repl
  const direct = await parseBehaviorDeptracedDependencies(
    {
      gathered: input.gathered,
      basket: input.basket,
    },
    context,
  );

  // compute transitive closure
  const visited = new Set<string>();
  const transitive: RefByUnique<typeof BehaviorGathered>[] = [];
  let circular = false;

  // track path for cycle detection
  const path = new Set<string>();
  path.add(serialize(input.gathered.behavior));

  // recursively collect all dependencies
  const collectTransitive = async (
    refs: RefByUnique<typeof BehaviorGathered>[],
  ): Promise<void> => {
    for (const ref of refs) {
      const key = serialize(ref);

      // detect cycle
      if (path.has(key)) {
        circular = true;
        continue;
      }

      // skip already visited
      if (visited.has(key)) continue;
      visited.add(key);

      // add to transitive set
      transitive.push(ref);

      // find the gathered behavior for this ref
      const depGathered = input.basket.find(
        (b) =>
          b.behavior.org === ref.behavior.org &&
          b.behavior.repo === ref.behavior.repo &&
          b.behavior.name === ref.behavior.name,
      );

      if (depGathered) {
        // recurse into this dependency's dependencies
        path.add(key);
        const depDeps = await parseBehaviorDeptracedDependencies(
          {
            gathered: depGathered,
            basket: input.basket,
          },
          context,
        );
        await collectTransitive(depDeps);
        path.delete(key);
      }
    }
  };

  await collectTransitive(direct);

  return { direct, transitive, circular };
};
