import type { RefByUnique } from 'domain-objects';
import { z } from 'zod';

import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import type { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import {
  getBehaviorGatheredCriteria,
  getBehaviorGatheredVision,
  getBehaviorGatheredWish,
} from '../gather/getBehaviorGatheredFileContent';

/**
 * schema for brain.repl dependency inference response
 */
const dependencyInferenceSchema = z.object({
  dependencies: z.array(
    z.object({
      ref: z.string().describe('behavior name or org/repo/behavior reference'),
      reason: z.string().describe('why this dependency was inferred'),
    }),
  ),
});

/**
 * .what = extracts dependency references from behavior content via brain.repl
 * .why = enables dependency graph construction via ai inference
 *
 * @note uses brain.repl to analyze wish, criteria, blueprint for dependency refs
 */
export const parseBehaviorDeptracedDependencies = async (
  input: {
    gathered: BehaviorGathered;
    basket: BehaviorGathered[];
  },
  context: BehaviorDispatchContext,
): Promise<RefByUnique<typeof BehaviorGathered>[]> => {
  const dependencies: RefByUnique<typeof BehaviorGathered>[] = [];

  // read behavior content from files
  const [wish, vision, criteria] = await Promise.all([
    getBehaviorGatheredWish({ gathered: input.gathered }),
    getBehaviorGatheredVision({ gathered: input.gathered }),
    getBehaviorGatheredCriteria({ gathered: input.gathered }),
  ]);

  // build prompt for brain.repl
  const basketNames = input.basket.map((b) => b.behavior.name);
  const prompt = buildDependencyInferencePrompt({
    gathered: input.gathered,
    basketNames,
    content: { wish, vision, criteria },
  });

  // invoke brain.repl.imagine to infer dependencies
  const inference = await context.brain.repl.imagine({
    prompt,
    schema: { ofOutput: dependencyInferenceSchema },
  });

  // resolve inferred refs against basket
  for (const dep of inference.dependencies) {
    const resolved = resolveDepRef({ ref: dep.ref, basket: input.basket });
    if (resolved) {
      dependencies.push({
        behavior: resolved.behavior,
        contentHash: resolved.contentHash,
      });
    } else {
      context.log.warn('unresolved dependency reference', {
        behavior: input.gathered.behavior.name,
        ref: dep.ref,
        reason: dep.reason,
      });
    }
  }

  return dependencies;
};

/**
 * .what = builds prompt for dependency inference
 * .why = provides context for brain.repl to analyze behavior content
 */
const buildDependencyInferencePrompt = (input: {
  gathered: BehaviorGathered;
  basketNames: string[];
  content: { wish: string | null; vision: string | null; criteria: string | null };
}): string => {
  const behaviorContent = [
    input.content.wish ? `## wish\n${input.content.wish}` : '',
    input.content.vision ? `## vision\n${input.content.vision}` : '',
    input.content.criteria ? `## criteria\n${input.content.criteria}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return `# dependency inference task

analyze the following behavior and identify any dependencies it has on other behaviors.

## behavior being analyzed
name: ${input.gathered.behavior.name}
org: ${input.gathered.behavior.org}
repo: ${input.gathered.behavior.repo}

${behaviorContent}

## available behaviors in basket
${input.basketNames.map((name) => `- ${name}`).join('\n')}

## instructions
1. read the behavior content (wish, criteria, vision)
2. identify any references to other behaviors (explicit or implicit)
3. look for patterns like:
   - "depends on X"
   - "requires X"
   - "blocked by X"
   - "after X is complete"
   - references to behavior names from the basket
4. return dependencies as json

## REQUIRED output format

CRITICAL RULES:
1. respond ONLY with a json code block - NO prose, NO explanation, NO preamble
2. each dependency MUST be an object with "ref" and "reason" fields, NOT a string
3. if no dependencies found, return empty array: { "dependencies": [] }
4. NEVER start your response with "I" or any conversational text

example with dependencies:
\`\`\`json
{
  "dependencies": [
    { "ref": "behavior-name", "reason": "explicit reference in criteria" }
  ]
}
\`\`\`

example with NO dependencies:
\`\`\`json
{
  "dependencies": []
}
\`\`\``;
};

/**
 * .what = resolves a dependency reference against the gathered basket
 * .why = matches dependency names to actual gathered behaviors
 */
const resolveDepRef = (input: {
  ref: string;
  basket: BehaviorGathered[];
}): BehaviorGathered | null => {
  // try exact match on behavior name
  const exactMatch = input.basket.find((b) => b.behavior.name === input.ref);
  if (exactMatch) return exactMatch;

  // try partial match (e.g., "feature-x" matching "v2025_01_01.feature-x")
  const partialMatch = input.basket.find(
    (b) =>
      b.behavior.name.includes(input.ref) ||
      input.ref.includes(b.behavior.name),
  );
  if (partialMatch) return partialMatch;

  // try matching with org/repo prefix (e.g., "repo-x/v2025_01_01.feature-x")
  if (input.ref.includes('/')) {
    const [repoPrefix, behaviorName] = input.ref.split('/');
    const repoMatch = input.basket.find(
      (b) =>
        b.behavior.repo.includes(repoPrefix ?? '') &&
        b.behavior.name === behaviorName,
    );
    if (repoMatch) return repoMatch;
  }

  return null;
};
