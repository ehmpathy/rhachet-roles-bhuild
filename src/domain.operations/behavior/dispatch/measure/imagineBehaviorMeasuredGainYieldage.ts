import { z } from 'zod';

import type { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import type { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { BehaviorMeasuredGainYieldage } from '../../../../domain.objects/BehaviorMeasuredGainYieldage';
import { BehaviorMeasuredGainYieldageChance } from '../../../../domain.objects/BehaviorMeasuredGainYieldageChance';
import { getBrief } from '../../../../infra/rhachet/getBrief';
import {
  getBehaviorGatheredCriteria,
  getBehaviorGatheredVision,
  getBehaviorGatheredWish,
} from '../gather/getBehaviorGatheredFileContent';

/**
 * schema for brain.repl.imagine yieldage estimation response
 */
const yieldageEstimationSchema = z.object({
  chances: z
    .array(
      z.object({
        yieldage: z.number().describe('$/wk value if this outcome occurs'),
        probability: z
          .number()
          .describe('probability this outcome occurs (0-1)'),
      }),
    )
    .describe('probabilistic outcomes for yieldage'),
  rationale: z.string().describe('explanation of how yieldage was estimated'),
});

/**
 * .what = computes yieldage (cash returns) for a behavior via brain.repl.imagine
 * .why = yieldage measures probabilistic cash value from behavior completion
 *
 * yieldage formula: sum(chance.yieldage * chance.probability)
 * - direct: expected value from this behavior (via brain.repl.imagine)
 * - transitive: additional value from dependent behaviors (deterministic)
 *
 * @note uses brain.repl.imagine for creative inference of direct yieldage
 */
export const imagineBehaviorMeasuredGainYieldage = async (
  input: {
    gathered: BehaviorGathered;
    deptraced: BehaviorDeptraced;
    basket: BehaviorGathered[];
    config: {
      defaults: {
        baseYieldage: number;
        transitiveMultiplier: number;
      };
    };
  },
  context: BehaviorDispatchContext,
): Promise<BehaviorMeasuredGainYieldage> => {
  // read behavior content from files
  const [wish, vision, criteria] = await Promise.all([
    getBehaviorGatheredWish({ gathered: input.gathered }),
    getBehaviorGatheredVision({ gathered: input.gathered }),
    getBehaviorGatheredCriteria({ gathered: input.gathered }),
  ]);

  // build prompt for brain.repl.imagine
  const prompt = buildYieldagePrompt({
    gathered: input.gathered,
    defaults: input.config.defaults,
    content: { wish, vision, criteria },
  });

  // invoke brain.repl.imagine to estimate direct yieldage chances
  const estimation = await context.brain.repl.imagine({
    prompt,
    role: {
      briefs: [
        getBrief({
          role: { name: 'dispatcher' },
          brief: { name: 'define.measure101.1.gain.[article].md' },
        }),
        getBrief({
          role: { name: 'dispatcher' },
          brief: { name: 'define.measure101.1.gain.yieldage.[article].md' },
        }),
      ],
    },
    schema: { ofOutput: yieldageEstimationSchema },
  });

  // compute expected value from chances
  const expected = computeExpectedValue(estimation.chances);

  // compute transitive yieldage from reverse dependencies (deterministic)
  const transitive = await computeTransitiveYieldage({
    deptraced: input.deptraced,
    basket: input.basket,
    directExpected: expected,
    multiplier: input.config.defaults.transitiveMultiplier,
  });

  return new BehaviorMeasuredGainYieldage({
    direct: {
      chances: estimation.chances.map(
        (c) =>
          new BehaviorMeasuredGainYieldageChance({
            yieldage: c.yieldage,
            probability: c.probability,
          }),
      ),
      expected,
    },
    transitive,
  });
};

/**
 * .what = builds prompt for yieldage estimation
 * .why = provides context for brain.repl.imagine to analyze cash returns
 */
const buildYieldagePrompt = (input: {
  gathered: BehaviorGathered;
  defaults: { baseYieldage: number };
  content: {
    wish: string | null;
    vision: string | null;
    criteria: string | null;
  };
}): string => {
  const behaviorContent = [
    input.content.wish ? `## wish\n${input.content.wish}` : '',
    input.content.vision ? `## vision\n${input.content.vision}` : '',
    input.content.criteria ? `## criteria\n${input.content.criteria}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return `# yieldage estimation task

estimate the cash value (yieldage) for completing this behavior.

## behavior being analyzed
name: ${input.gathered.behavior.name}
status: ${input.gathered.status}

${behaviorContent}

## context
- base yieldage reference: ${input.defaults.baseYieldage} $/wk
- yieldage measures recurring cash value gained per week

## instructions
1. analyze the behavior content to estimate potential cash value
2. consider multiple possible outcomes with probabilities
3. probabilities must sum to 1.0
4. express yieldage in $/wk (dollars gained per week)

## REQUIRED output format

CRITICAL: respond ONLY with a json code block containing exactly these two fields at the TOP LEVEL:
- "chances": array of objects, each with "yieldage" (number) and "probability" (number 0-1)
- "rationale": string (brief explanation)

\`\`\`json
{
  "chances": [
    { "yieldage": 100, "probability": 0.7 },
    { "yieldage": 0, "probability": 0.3 }
  ],
  "rationale": "70% chance of $100/wk revenue, 30% chance of no revenue"
}
\`\`\``;
};

/**
 * .what = computes expected value from yieldage chances
 * .why = expected value = sum(yieldage * probability)
 */
const computeExpectedValue = (
  chances: Array<{ yieldage: number; probability: number }>,
): number => {
  return chances.reduce(
    (sum, chance) => sum + chance.yieldage * chance.probability,
    0,
  );
};

/**
 * .what = computes transitive yieldage from reverse dependencies
 * .why = behaviors that unblock many others provide multiplicative value
 */
const computeTransitiveYieldage = async (input: {
  deptraced: BehaviorDeptraced;
  basket: BehaviorGathered[];
  directExpected: number;
  multiplier: number;
}): Promise<number> => {
  // count behaviors that depend on this one (reverse deps)
  const reverseDepsCount = await countReverseDependencies({
    behaviorName: input.deptraced.gathered.behavior.name,
    basket: input.basket,
  });

  // transitive yieldage = reverseDeps * directExpected * multiplier
  return reverseDepsCount * input.directExpected * input.multiplier;
};

/**
 * .what = counts how many behaviors depend on a given behavior
 * .why = enables multiplicative yieldage calculation
 */
const countReverseDependencies = async (input: {
  behaviorName: string;
  basket: BehaviorGathered[];
}): Promise<number> => {
  let count = 0;

  for (const gathered of input.basket) {
    const criteria = await getBehaviorGatheredCriteria({ gathered });
    if (!criteria) continue;

    if (
      criteria.includes(input.behaviorName) ||
      criteria.includes(`depends_on: ${input.behaviorName}`) ||
      criteria.includes(`requires: ${input.behaviorName}`)
    ) {
      count++;
    }
  }

  return count;
};
