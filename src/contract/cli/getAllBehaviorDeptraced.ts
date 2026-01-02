import * as path from 'path';

import type { BehaviorDeptraced } from '../../domain.objects/BehaviorDeptraced';
import { getAllBehaviorDeptraced } from '../../domain.operations/behavior/dispatch/deptrace/getOneBehaviorDeptraced';
import { getAllBehaviorGathered } from '../../domain.operations/behavior/dispatch/gather/getAllBehaviorGathered';
import { genBehaviorDispatchContext } from '../../domain.operations/behavior/dispatch/genBehaviorDispatchContext';

/**
 * .what = CLI command for dependency tracing of gathered behaviors
 * .why = enables running deptrace skill via command line
 *
 * @example
 * npx tsx ./src/contract/cli/getAllBehaviorDeptraced.ts --config ./rhachet.dispatch.yml
 */
export const runDeptraceCommand = async (input: {
  configPath?: string;
  repoDir?: string;
}): Promise<BehaviorDeptraced[]> => {
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

  // output summary
  console.log(`deptraced ${deptraced.length} behaviors`);
  for (const behavior of deptraced) {
    const depCount = behavior.dependsOnDirect.length;
    console.log(
      `  - ${behavior.gathered.behavior.name}: ${depCount} direct dependencies`,
    );
  }

  return deptraced;
};

// run if invoked directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const configPath = args.find((a) => a.startsWith('--config='))?.split('=')[1];
  const repoDir = args.find((a) => a.startsWith('--repo='))?.split('=')[1];

  runDeptraceCommand({ configPath, repoDir }).catch((error) => {
    console.error('deptrace failed:', error);
    process.exit(1);
  });
}
