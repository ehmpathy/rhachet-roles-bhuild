import { z } from 'zod';

import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import type { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import { BehaviorMeasuredCostAttend } from '../../../../domain.objects/BehaviorMeasuredCostAttend';
import { getBrief } from '../../../../infra/rhachet/getBrief';
import {
  getBehaviorGatheredCriteria,
  getBehaviorGatheredVision,
  getBehaviorGatheredWish,
} from '../gather/getBehaviorGatheredFileContent';

/**
 * schema for brain.repl.imagine attend estimation response
 */
const attendEstimationSchema = z.object({
  upfront: z
    .number()
    .describe('one-time time cost in minutes to complete this behavior'),
  recurrent: z
    .number()
    .describe('ongoing time cost in mins/wk to maintain/operate this behavior'),
  rationale: z.string().describe('explanation of how attend was estimated'),
});

/**
 * .what = computes attend (time investment) for a behavior via brain.repl.imagine
 * .why = attend measures time required to complete and maintain behavior
 *
 * attend formula: composite = (upfront ÷ cost.horizon) + recurrent
 * - upfront: one-time time cost (mins), amortized over cost.horizon
 * - recurrent: ongoing time cost (mins/wk)
 * - composite: total time cost per week (mins/wk)
 *
 * @note uses brain.repl.imagine for creative inference of upfront/recurrent
 * @note composite is computed deterministically from upfront/recurrent
 */
export const imagineBehaviorMeasuredCostAttend = async (
  input: {
    gathered: BehaviorGathered;
    config: {
      cost: {
        horizon: { weeks: number };
      };
    };
  },
  context: BehaviorDispatchContext,
): Promise<BehaviorMeasuredCostAttend> => {
  // read behavior content from files
  const [wish, vision, criteria] = await Promise.all([
    getBehaviorGatheredWish({ gathered: input.gathered }),
    getBehaviorGatheredVision({ gathered: input.gathered }),
    getBehaviorGatheredCriteria({ gathered: input.gathered }),
  ]);

  // build prompt for brain.repl.imagine
  const prompt = buildAttendPrompt({
    gathered: input.gathered,
    horizon: input.config.cost.horizon.weeks,
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
          brief: { name: 'define.measure101.2.cost.attend.[article].md' },
        }),
      ],
    },
    schema: { ofOutput: attendEstimationSchema },
  });

  // compute composite deterministically
  const composite =
    estimation.upfront / input.config.cost.horizon.weeks + estimation.recurrent;

  return new BehaviorMeasuredCostAttend({
    upfront: estimation.upfront,
    recurrent: estimation.recurrent,
    composite,
  });
};

/**
 * .what = builds prompt for attend estimation
 * .why = provides context for brain.repl.imagine to analyze time investment
 */
const buildAttendPrompt = (input: {
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

  return `# attend estimation task

estimate the time investment (attend) required for this behavior.

## behavior being analyzed
name: ${input.gathered.behavior.name}
status: ${input.gathered.status}

${behaviorContent}

## context
- cost.horizon: ${input.horizon} weeks (for amortizing upfront costs)
- upfront: one-time time cost in minutes to complete this behavior
- recurrent: ongoing time cost in mins/wk to maintain/operate

## instructions
1. analyze the behavior content to estimate time investment
2. consider both implementation time (upfront) and maintenance time (recurrent)
3. express upfront in minutes (total one-time cost)
4. express recurrent in mins/wk (ongoing weekly cost)

## REQUIRED output format

CRITICAL: respond ONLY with a json code block containing exactly these three fields at the TOP LEVEL:
- "upfront": number (minutes total to complete)
- "recurrent": number (mins/wk to maintain)
- "rationale": string (brief explanation)

\`\`\`json
{
  "upfront": 480,
  "recurrent": 10,
  "rationale": "8 hours to implement, 10 mins/wk ongoing maintenance"
}
\`\`\``;
};
