import * as fs from 'fs/promises';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

import type { BehaviorDecompositionPlan } from '../../../domain.objects/BehaviorDecompositionPlan';
import type { BehaviorDecompositionProposed } from '../../../domain.objects/BehaviorDecompositionProposed';

/**
 * .what = applies a decomposition plan by creating sub-behavior directories
 * .why = enables --mode apply to create approved sub-behaviors from templates
 */
export const applyPlan = async (input: {
  plan: BehaviorDecompositionPlan;
}): Promise<{
  behaviorsCreated: string[];
  decomposedMarkerPath: string;
}> => {
  const { plan } = input;

  // extract parent behavior path
  const parentBehaviorPath = plan.behaviorSource.path;
  if (!parentBehaviorPath)
    throw new UnexpectedCodePathError(
      'plan.behaviorSource.path is required for apply',
      { plan },
    );

  // extract the .behavior root (parent of the behavior dir)
  const behaviorRoot = path.dirname(parentBehaviorPath);

  // validate parent behavior directory exists
  const parentExists = await fs
    .access(parentBehaviorPath)
    .then(() => true)
    .catch(() => false);
  if (!parentExists)
    throw new BadRequestError('parent behavior directory not found', {
      parentBehaviorPath,
    });

  // check for z.decomposed.md marker (fail if already decomposed)
  const decomposedMarkerPath = path.join(parentBehaviorPath, 'z.decomposed.md');
  const alreadyDecomposed = await fs
    .access(decomposedMarkerPath)
    .then(() => true)
    .catch(() => false);
  if (alreadyDecomposed)
    throw new BadRequestError(
      'behavior already decomposed; remove z.decomposed.md to re-decompose',
      { decomposedMarkerPath },
    );

  // generate isodate for new behavior directories
  const isoDate = new Date().toISOString().split('T')[0]?.replace(/-/g, '_');
  if (!isoDate)
    throw new UnexpectedCodePathError('failed to generate isoDate', {});

  // track created behaviors
  const behaviorsCreated: string[] = [];

  // create each proposed behavior
  for (const proposed of plan.behaviorsProposed) {
    const behaviorPath = await createSubBehavior({
      proposed,
      behaviorRoot,
      isoDate,
      parentBehaviorPath,
    });
    behaviorsCreated.push(behaviorPath);
  }

  // create z.decomposed.md in parent to mark as decomposed
  const decomposedContent = generateDecomposedContent({
    plan,
    behaviorsCreated,
    behaviorRoot,
  });
  await fs.writeFile(decomposedMarkerPath, decomposedContent);

  return {
    behaviorsCreated,
    decomposedMarkerPath,
  };
};

/**
 * .what = creates a sub-behavior directory with wish and vision
 * .why = encapsulates the directory creation logic for each proposed behavior
 */
const createSubBehavior = async (input: {
  proposed: BehaviorDecompositionProposed;
  behaviorRoot: string;
  isoDate: string;
  parentBehaviorPath: string;
}): Promise<string> => {
  const { proposed, behaviorRoot, isoDate, parentBehaviorPath } = input;

  // construct behavior directory path
  const behaviorDirName = `v${isoDate}.${proposed.name}`;
  const behaviorPath = path.join(behaviorRoot, behaviorDirName);

  // check for name conflicts
  const conflictExists = await fs
    .access(behaviorPath)
    .then(() => true)
    .catch(() => false);
  if (conflictExists)
    throw new BadRequestError(`behavior "${proposed.name}" already exists`, {
      behaviorPath,
    });

  // create behavior directory
  await fs.mkdir(behaviorPath, { recursive: true });

  // compute relative path from behavior dir to parent for references
  const parentRelPath = path.relative(behaviorPath, parentBehaviorPath);

  // write 0.wish.md with scoped wish
  const wishContent = `wish = ${proposed.decomposed.wish}\n\n---\n\ndecomposed from: ${parentRelPath}\n`;
  await fs.writeFile(path.join(behaviorPath, '0.wish.md'), wishContent);

  // write 1.vision.md with scoped vision (or empty if null)
  const visionContent = proposed.decomposed.vision
    ? `${proposed.decomposed.vision}\n\n---\n\ndecomposed from: ${parentRelPath}\n`
    : `\n`;
  await fs.writeFile(path.join(behaviorPath, '1.vision.md'), visionContent);

  // write 2.criteria.md template (NOT copied from parent)
  const criteriaTemplate = `# criteria for ${proposed.name}

## blackbox criteria

# usecase.1 = ...
given()
  when()
    then()

## blueprint criteria

(declare after blackbox criteria is complete)
`;
  await fs.writeFile(
    path.join(behaviorPath, '2.criteria.md'),
    criteriaTemplate,
  );

  return behaviorPath;
};

/**
 * .what = generates content for z.decomposed.md marker file
 * .why = documents the decomposition for future reference
 */
const generateDecomposedContent = (input: {
  plan: BehaviorDecompositionPlan;
  behaviorsCreated: string[];
  behaviorRoot: string;
}): string => {
  const { plan, behaviorsCreated, behaviorRoot } = input;

  const behaviorList = behaviorsCreated
    .map((behaviorPath) => {
      const dirName = path.basename(behaviorPath);
      const relPath = path.relative(behaviorRoot, behaviorPath);
      return `- ${relPath}`;
    })
    .join('\n');

  const dependencyList = plan.behaviorsProposed
    .filter((b) => b.dependsOn.length > 0)
    .map((b) => `- ${b.name} depends on: ${b.dependsOn.join(', ')}`)
    .join('\n');

  return `# decomposed

this behavior has been decomposed into focused sub-behaviors.

## sub-behaviors

${behaviorList}

## dependency order

${dependencyList || '(no dependencies declared)'}

## decomposition metadata

- generated at: ${plan.generatedAt}
- context analysis: ${plan.contextAnalysis.usage.window.percentage}% of context window
- recommendation: ${plan.contextAnalysis.recommendation}
`;
};
