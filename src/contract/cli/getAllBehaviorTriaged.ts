import * as path from 'path';

import type { BehaviorTriaged } from '../../domain.objects/BehaviorTriaged';
import { getAllBehaviorDeptraced } from '../../domain.operations/behavior/dispatch/deptrace/getOneBehaviorDeptraced';
import { getAllBehaviorGathered } from '../../domain.operations/behavior/dispatch/gather/getAllBehaviorGathered';
import { genBehaviorDispatchContext } from '../../domain.operations/behavior/dispatch/genBehaviorDispatchContext';
import { getAllBehaviorMeasured } from '../../domain.operations/behavior/dispatch/measure/getOneBehaviorMeasured';
import { getAllBehaviorTriaged } from '../../domain.operations/behavior/dispatch/triage/getAllBehaviorTriaged';

/**
 * .what = CLI command for triaging behaviors by readiness and priority
 * .why = enables running triage skill via command line
 *
 * @example
 * npx tsx ./src/contract/cli/getAllBehaviorTriaged.ts --config ./rhachet.dispatch.yml
 */
export const runTriageCommand = async (input: {
  configPath?: string;
  repoDir?: string;
}): Promise<BehaviorTriaged[]> => {
  // parse arguments with defaults
  const configPath = input.configPath ?? './rhachet.dispatch.yml';
  const repoDir = input.repoDir ?? process.cwd();

  // resolve paths
  const resolvedConfigPath = path.isAbsolute(configPath)
    ? configPath
    : path.join(repoDir, configPath);

  // generate dispatch context
  const context = await genBehaviorDispatchContext(
    { configPath: resolvedConfigPath, repoDir },
    { log: console },
  );

  // gather behaviors first
  const gathered = await getAllBehaviorGathered({ repoDir }, context);
  console.log(`gathered ${gathered.length} behaviors`);

  // run deptrace
  const deptraced = await getAllBehaviorDeptraced(
    { basket: gathered },
    context,
  );
  console.log(`deptraced ${deptraced.length} behaviors`);

  // run measure
  const measured = await getAllBehaviorMeasured(
    { gatheredBasket: gathered, deptracedBasket: deptraced },
    context,
  );
  console.log(`measured ${measured.length} behaviors`);

  // run triage
  const triageResult = await getAllBehaviorTriaged(
    { measuredBasket: measured, deptracedBasket: deptraced },
    context,
  );

  // output summary
  console.log(`triaged ${triageResult.behaviors.length} behaviors`);
  for (const behavior of triageResult.behaviors) {
    console.log(
      `  - ${behavior.gathered.behavior.name}: priority=${behavior.priority}, decision=${behavior.decision}`,
    );
  }

  return triageResult.behaviors;
};

// run if invoked directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const configPath = args.find((a) => a.startsWith('--config='))?.split('=')[1];
  const repoDir = args.find((a) => a.startsWith('--repo='))?.split('=')[1];

  runTriageCommand({ configPath, repoDir }).catch((error) => {
    console.error('triage failed:', error);
    process.exit(1);
  });
}
