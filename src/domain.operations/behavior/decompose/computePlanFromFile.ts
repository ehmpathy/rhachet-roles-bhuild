import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';

import { BehaviorDecompositionPlan } from '../../../domain.objects/BehaviorDecompositionPlan';

/**
 * .what = reads and validates a decomposition plan from a JSON file
 * .why = enables --mode apply to consume approved plans from disk
 */
export const computePlanFromFile = async (input: {
  planPath: string;
}): Promise<BehaviorDecompositionPlan> => {
  // read the plan file
  const planContent = await fs.readFile(input.planPath, 'utf-8');

  // parse the JSON
  let planData: unknown;
  try {
    planData = JSON.parse(planContent);
  } catch {
    throw new BadRequestError('plan file is not valid JSON', {
      planPath: input.planPath,
    });
  }

  // validate required fields are present
  const data = planData as Record<string, unknown>;
  if (!data.behaviorSource)
    throw new BadRequestError('plan file lacks behaviorSource', {
      planPath: input.planPath,
    });
  if (!data.behaviorsProposed)
    throw new BadRequestError('plan file lacks behaviorsProposed', {
      planPath: input.planPath,
    });
  if (!data.contextAnalysis)
    throw new BadRequestError('plan file lacks contextAnalysis', {
      planPath: input.planPath,
    });
  if (!data.generatedAt)
    throw new BadRequestError('plan file lacks generatedAt', {
      planPath: input.planPath,
    });

  // construct domain object (validates nested structure)
  return new BehaviorDecompositionPlan(
    data as unknown as BehaviorDecompositionPlan,
  );
};
