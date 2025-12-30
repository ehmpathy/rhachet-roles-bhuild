import { z } from 'zod';

import type { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import type { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { BehaviorMeasuredGainLeverage } from '../../../../domain.objects/BehaviorMeasuredGainLeverage';
import { getBrief } from '../../../../infra/rhachet/getBrief';

/**
 * schema for brain.repl leverage estimation response
 */
const leverageEstimationSchema = z.object({
  direct: z
    .number()
    .describe('mins/wk saved directly by this behavior (time gained per week)'),
  transitive: z
    .number()
    .describe(
      'additional mins/wk saved through unblocking dependent behaviors',
    ),
  rationale: z.string().describe('explanation of how leverage was estimated'),
});

/**
 * .what = computes leverage (time savings) for a behavior via brain.repl
 * .why = leverage measures how much time is saved by completing this behavior
 *
 * leverage formula: direct + transitive (both in mins/wk)
 * - direct: mins/wk saved by this behavior directly
 * - transitive: additional mins/wk saved through dependent behaviors
 *
 * @note uses brain.repl for creative inference of time savings
 */
export const imagineBehaviorMeasuredGainLeverage = async (
  input: {
    gathered: BehaviorGathered;
    deptraced: BehaviorDeptraced;
    basket: BehaviorGathered[];
    config: {
      weights: {
        author: number;
        support: number;
      };
    };
  },
  context: BehaviorDispatchContext,
): Promise<BehaviorMeasuredGainLeverage> => {
  // build prompt for brain.repl
  const prompt = buildLeveragePrompt({
    gathered: input.gathered,
    deptraced: input.deptraced,
    basket: input.basket,
    weights: input.config.weights,
  });

  // invoke brain.repl.imagine to estimate leverage
  const estimation = await context.brain.repl.imagine({
    prompt,
    briefs: [
      getBrief({ role: { name: 'dispatcher' }, brief: { name: 'define.measure101.1.gain.[article].md' } }),
      getBrief({ role: { name: 'dispatcher' }, brief: { name: 'define.measure101.1.gain.leverage.[article].compressed.md' } }),
    ],
    schema: { ofOutput: leverageEstimationSchema },
  });

  return new BehaviorMeasuredGainLeverage({
    direct: estimation.direct,
    transitive: estimation.transitive,
  });
};

/**
 * .what = builds prompt for leverage estimation
 * .why = provides context for brain.repl to analyze time savings
 */
const buildLeveragePrompt = (input: {
  gathered: BehaviorGathered;
  deptraced: BehaviorDeptraced;
  basket: BehaviorGathered[];
  weights: { author: number; support: number };
}): string => {
  const behaviorContent = [
    input.gathered.wish ? `## wish\n${input.gathered.wish}` : '',
    input.gathered.vision ? `## vision\n${input.gathered.vision}` : '',
    input.gathered.criteria ? `## criteria\n${input.gathered.criteria}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const reverseDeps = input.basket.filter((b) =>
    input.deptraced.dependsOnTransitive.some(
      (dep) => dep.behavior.name === b.behavior.name,
    ),
  );

  return `# leverage estimation task

estimate the time savings (leverage) for completing this behavior.

## behavior being analyzed
name: ${input.gathered.behavior.name}
status: ${input.gathered.status}

${behaviorContent}

## weights for leverage calculation
- author weight: ${input.weights.author} (time saved to create/add features)
- support weight: ${input.weights.support} (time saved to operate/fix issues)

## dependent behaviors (unblocked by this behavior)
${reverseDeps.length > 0 ? reverseDeps.map((b) => `- ${b.behavior.name}`).join('\n') : 'none'}

## instructions
1. analyze the behavior content to estimate time savings
2. consider both author leverage (time saved creating) and support leverage (time saved operating)
3. estimate transitive leverage from unblocking dependent behaviors
4. express all values in mins/wk (minutes saved per week)

## REQUIRED output format

CRITICAL: respond ONLY with a json code block containing exactly these three fields at the TOP LEVEL:
- "direct": number (mins/wk saved directly)
- "transitive": number (additional mins/wk from unblocking)
- "rationale": string (brief explanation)

\`\`\`json
{
  "direct": 30,
  "transitive": 0,
  "rationale": "saves 30 mins/wk in reduced manual work"
}
\`\`\``;
};
