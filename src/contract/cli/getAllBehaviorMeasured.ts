import * as path from 'path';

import type { BehaviorMeasured } from '../../domain.objects/BehaviorMeasured';
import { getAllBehaviorDeptraced } from '../../domain.operations/behavior/dispatch/deptrace/getOneBehaviorDeptraced';
import { getAllBehaviorGathered } from '../../domain.operations/behavior/dispatch/gather/getAllBehaviorGathered';
import { genBehaviorDispatchContext } from '../../domain.operations/behavior/dispatch/genBehaviorDispatchContext';
import { getAllBehaviorMeasured } from '../../domain.operations/behavior/dispatch/measure/getOneBehaviorMeasured';

/**
 * .what = CLI command for measuring behaviors with gain/cost metrics
 * .why = enables running measure skill via command line
 *
 * @example
 * npx tsx ./src/contract/cli/getAllBehaviorMeasured.ts --config ./rhachet.dispatch.yml
 */
export const runMeasureCommand = async (input: {
  configPath?: string;
  repoDir?: string;
}): Promise<BehaviorMeasured[]> => {
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

  // output summary
  console.log(`measured ${measured.length} behaviors`);
  for (const behavior of measured) {
    console.log(
      `  - ${behavior.gathered.behavior.name}: gain=${behavior.gain.composite.toFixed(2)}, cost=${behavior.cost.composite.toFixed(2)}`,
    );
  }

  return measured;
};

// run if invoked directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const configPath = args.find((a) => a.startsWith('--config='))?.split('=')[1];
  const repoDir = args.find((a) => a.startsWith('--repo='))?.split('=')[1];

  runMeasureCommand({ configPath, repoDir }).catch((error) => {
    console.error('measure failed:', error);
    process.exit(1);
  });
}
