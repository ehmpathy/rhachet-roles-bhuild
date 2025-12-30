import { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import type { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { computeBehaviorDeptracedTransitiveDeps } from './computeBehaviorDeptracedTransitiveDeps';

/**
 * .what = resolves dependency graph for a single behavior
 * .why = enables transitive impact scoring by knowing what depends on what
 *
 * @note uses brain.repl via computeBehaviorDeptracedTransitiveDeps for inference
 */
export const getOneBehaviorDeptraced = async (
  input: {
    gathered: BehaviorGathered;
    basket: BehaviorGathered[];
  },
  context: BehaviorDispatchContext,
): Promise<BehaviorDeptraced> => {
  // compute direct and transitive dependencies via brain.repl
  const { direct, transitive, circular } =
    await computeBehaviorDeptracedTransitiveDeps(
      {
        gathered: input.gathered,
        basket: input.basket,
      },
      context,
    );

  // log if circular dependency detected
  if (circular) {
    context.log.warn('circular dependency detected', {
      behavior: input.gathered.behavior.name,
    });
  }

  // construct deptraced entity
  const deptraced = new BehaviorDeptraced({
    deptracedAt: new Date().toISOString(),
    gathered: {
      behavior: input.gathered.behavior,
      contentHash: input.gathered.contentHash,
    },
    dependsOnDirect: direct,
    dependsOnTransitive: transitive,
  });

  return deptraced;
};

/**
 * .what = resolves dependency graph for all gathered behaviors
 * .why = enables batch processing of the entire behavior basket
 */
export const getAllBehaviorDeptraced = async (
  input: {
    basket: BehaviorGathered[];
  },
  context: BehaviorDispatchContext,
): Promise<BehaviorDeptraced[]> => {
  // process each gathered behavior
  const deptraced: BehaviorDeptraced[] = [];
  for (const gathered of input.basket) {
    const result = await getOneBehaviorDeptraced(
      { gathered, basket: input.basket },
      context,
    );
    deptraced.push(result);
  }

  return deptraced;
};
