import { z } from 'zod';

import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import type { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { BehaviorMeasuredCostExpend } from '../../../../domain.objects/BehaviorMeasuredCostExpend';
import { getBrief } from '../../../../infra/rhachet/getBrief';
import {
  getBehaviorGatheredCriteria,
  getBehaviorGatheredVision,
  getBehaviorGatheredWish,
} from '../gather/getBehaviorGatheredFileContent';

/**
 * schema for brain.repl.imagine expend estimation response
 */
const expendEstimationSchema = z.object({
  upfront: z
    .number()
    .describe('one-time cash cost in dollars to complete this behavior'),
  recurrent: z
    .number()
    .describe('ongoing cash cost in $/wk to maintain/operate this behavior'),
  rationale: z.string().describe('explanation of how expend was estimated'),
});

/**
 * .what = computes expend (cash investment) for a behavior via brain.repl.imagine
 * .why = expend measures cash required to complete and maintain behavior
 *
 * expend formula: composite = (upfront ÷ cost.horizon) + recurrent
 * - upfront: one-time cash cost ($$), amortized over cost.horizon
 * - recurrent: ongoing cash cost ($$/wk)
 * - composite: total cash cost per week ($$/wk)
 *
 * @note uses brain.repl.imagine for creative inference of upfront/recurrent
 * @note composite is computed deterministically from upfront/recurrent
 */
export const imagineBehaviorMeasuredCostExpend = async (
  input: {
    gathered: BehaviorGathered;
    config: {
      cost: {
        horizon: number;
      };
    };
  },
  context: BehaviorDispatchContext,
): Promise<BehaviorMeasuredCostExpend> => {
  // read behavior content from files
  const [wish, vision, criteria] = await Promise.all([
    getBehaviorGatheredWish({ gathered: input.gathered }),
    getBehaviorGatheredVision({ gathered: input.gathered }),
    getBehaviorGatheredCriteria({ gathered: input.gathered }),
  ]);

  // build prompt for brain.repl.imagine
  const prompt = buildExpendPrompt({
    gathered: input.gathered,
    horizon: input.config.cost.horizon,
    content: { wish, vision, criteria },
  });

  // invoke brain.repl.imagine to estimate upfront/recurrent
  const estimation = await context.brain.repl.imagine({
    prompt,
    role: {
      briefs: [
        getBrief({
          role: { name: 'dispatcher' },
          brief: { name: 'define.measure101.2.cost.[article].md' },
        }),
        getBrief({
          role: { name: 'dispatcher' },
          brief: { name: 'define.measure101.2.cost.expend.[article].md' },
        }),
      ],
    },
    schema: { ofOutput: expendEstimationSchema },
  });

  // compute composite deterministically
  const composite =
    estimation.upfront / input.config.cost.horizon + estimation.recurrent;

  return new BehaviorMeasuredCostExpend({
    upfront: estimation.upfront,
    recurrent: estimation.recurrent,
    composite,
  });
};

/**
 * .what = builds prompt for expend estimation
 * .why = provides context for brain.repl.imagine to analyze cash investment
 */
const buildExpendPrompt = (input: {
  gathered: BehaviorGathered;
  horizon: number;
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

  return `# expend estimation task

estimate the cash investment (expend) required for this behavior.

## behavior being analyzed
name: ${input.gathered.behavior.name}
status: ${input.gathered.status}

${behaviorContent}

## context
- cost.horizon: ${input.horizon} weeks (for amortizing upfront costs)
- upfront: one-time cash cost in $$ to complete this behavior
- recurrent: ongoing cash cost in $$/wk to maintain/operate

## instructions
1. analyze the behavior content to estimate cash investment
2. consider upfront costs: infrastructure, tooling, licensing, development
3. consider recurrent costs: hosting, subscriptions, maintenance, operations
4. express upfront in $$ (total one-time cost)
5. express recurrent in $$/wk (ongoing weekly cost)

## REQUIRED output format

CRITICAL: respond ONLY with a json code block containing exactly these three fields at the TOP LEVEL:
- "upfront": number (dollars total to complete)
- "recurrent": number (dollars/wk to maintain)
- "rationale": string (brief explanation)

\`\`\`json
{
  "upfront": 500,
  "recurrent": 25,
  "rationale": "one-time setup cost, $25/wk ongoing infrastructure"
}
\`\`\``;
};
