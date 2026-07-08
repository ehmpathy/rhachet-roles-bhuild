import { join } from 'path';

import { getOneBehaviorArtifactPath } from './getOneBehaviorArtifactPath';

type BehaviorArtifact = { scope: string; path: string; required: boolean };

/**
 * .what = compute the ordered set of behavior artifacts the boot hook surfaces
 * .why = the boot hook must re-inject wish + vision + criteria + blueprint on
 *        session start. this decides WHICH files to emit (by found path),
 *        so discovery is testable apart from the stdout side effect.
 *
 * .note = only the current behavior template is supported. `0.wish.md` is the
 *         human input (fixed `.md` name); every other artifact is a
 *         driver-produced `${stoneName}.yield.md`. legacy behaviors are not
 *         found.
 *
 * .note = built declaratively: each optional artifact is a nullable entry, and
 *         the final list drops the nulls — no in-place array mutation.
 */
export const getAllBehaviorContextArtifacts = (input: {
  behaviorDir: string;
}): BehaviorArtifact[] => {
  // find a stone's `.yield.md` artifact, scoped for its stdout block
  const findOptionalArtifact = (
    scope: string,
    stoneName: string,
  ): BehaviorArtifact | null => {
    const path = getOneBehaviorArtifactPath({
      behaviorDir: input.behaviorDir,
      stoneName,
    });
    return path ? { scope, path, required: false } : null;
  };

  // wish: the required input (fixed name); always present so absence can warn
  const wish: BehaviorArtifact = {
    scope: 'wish',
    path: join(input.behaviorDir, '0.wish.md'),
    required: true,
  };

  // vision (optional)
  const vision = findOptionalArtifact('vision', '1.vision');

  // criteria (optional): blackbox + blueprint pair
  const criteriaBlackbox = findOptionalArtifact(
    'criteria-blackbox',
    '2.1.criteria.blackbox',
  );
  const criteriaBlueprint = findOptionalArtifact(
    'criteria-blueprint',
    '2.3.criteria.blueprint',
  );

  // blueprints (optional): factory (the machine) + product (the deliverable)
  const factoryBlueprint = findOptionalArtifact(
    'blueprint-factory',
    '3.3.0.blueprint.factory',
  );
  const productBlueprint = findOptionalArtifact(
    'blueprint',
    '3.3.1.blueprint.product',
  );

  // assemble in stable order, then drop the absent optionals
  return [
    wish,
    vision,
    criteriaBlackbox,
    criteriaBlueprint,
    factoryBlueprint,
    productBlueprint,
  ].filter((entry): entry is BehaviorArtifact => entry !== null);
};
