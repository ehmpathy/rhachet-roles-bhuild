import * as fs from 'fs/promises';
import * as path from 'path';

import { BehaviorDecompositionPlan } from '../../../domain.objects/BehaviorDecompositionPlan';
import { BehaviorDecompositionProposed } from '../../../domain.objects/BehaviorDecompositionProposed';
import type { BehaviorPersisted } from '../../../domain.objects/BehaviorPersisted';
import type {
  BrainReplContext,
  BrainReplRole,
} from '../../../infra/brain/BrainReplContext';
import { computeContextConsumption } from './computeContextConsumption';

/**
 * .what = imagines a decomposition plan via brain.repl
 * .why = leverages LLM for creative boundary analysis while I/O remains deterministic
 */
export const imaginePlan = async (
  input: {
    behavior: BehaviorPersisted;
    role: BrainReplRole;
  },
  context: {
    brain: { repl: BrainReplContext };
  },
): Promise<BehaviorDecompositionPlan> => {
  // compute context consumption (deterministic)
  const contextAnalysis = await computeContextConsumption({
    behavior: input.behavior,
  });

  // read source artifacts for prompt
  const wishContent = await fs.readFile(
    path.join(input.behavior.path, '0.wish.md'),
    'utf-8',
  );
  const visionContent = await fs
    .readFile(path.join(input.behavior.path, '1.vision.md'), 'utf-8')
    .catch(() => '');
  const criteriaContent = await fs.readFile(
    path.join(input.behavior.path, '2.criteria.md'),
    'utf-8',
  );

  // build prompt for brain.repl
  const prompt = buildDecompositionPrompt({
    behaviorName: input.behavior.name,
    wishContent,
    visionContent,
    criteriaContent,
  });

  // invoke brain.repl for creative analysis (probabilistic)
  const brainOutput = await context.brain.repl.imagine({
    prompt,
    role: input.role,
    outputFormat: 'json',
  });

  // parse brain output into structured plan
  const planParsed = parseBrainOutput({ output: brainOutput });

  // construct domain object
  const plan = new BehaviorDecompositionPlan({
    behaviorSource: input.behavior,
    behaviorsProposed: planParsed.behaviorsProposed.map(
      (p) => new BehaviorDecompositionProposed(p),
    ),
    contextAnalysis,
    generatedAt: new Date().toISOString(),
  });

  return plan;
};

/**
 * .what = builds prompt for brain.repl decomposition analysis
 * .why = structures the creative task for consistent output
 */
const buildDecompositionPrompt = (input: {
  behaviorName: string;
  wishContent: string;
  visionContent: string;
  criteriaContent: string;
}): string => {
  return `
analyze this behavior for decomposition into focused behaviors.

## source behavior: ${input.behaviorName}

### wish
${input.wishContent}

### vision
${input.visionContent || '(empty)'}

### criteria
${input.criteriaContent}

## task

1. identify natural boundaries in the criteria
2. propose behavior names based on domain concepts
3. identify dependencies between behaviors
4. decompose the wish into scoped wishes for each behavior
5. decompose the vision into scoped visions (or null if original was empty)

## output format (JSON)

{
  "behaviorsProposed": [
    {
      "name": "behavior-name",
      "dependsOn": [],
      "decomposed": {
        "wish": "decomposed wish...",
        "vision": "decomposed vision..." | null
      }
    }
  ]
}
`.trim();
};

/**
 * .what = parses brain output JSON into typed structure
 * .why = bridges probabilistic output to deterministic domain objects
 */
const parseBrainOutput = (input: {
  output: string;
}): {
  behaviorsProposed: Array<{
    name: string;
    dependsOn: string[];
    decomposed: { wish: string; vision: string | null };
  }>;
} => {
  // extract JSON from brain output
  const jsonMatch = input.output.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('brain output did not contain valid JSON');
  }
  return JSON.parse(jsonMatch[0]);
};
