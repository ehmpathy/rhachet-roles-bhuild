import * as path from 'path';

import type { BehaviorGathered } from '../../domain.objects/BehaviorGathered';
import { getAllBehaviorGathered } from '../../domain.operations/behavior/dispatch/gather/getAllBehaviorGathered';
import { genBehaviorDispatchContext } from '../../domain.operations/behavior/dispatch/genBehaviorDispatchContext';

/**
 * .what = CLI command for gathering behaviors from sources
 * .why = enables running gather skill via command line
 *
 * @example
 * npx tsx ./src/contract/cli/getAllBehaviorGathered.ts --config ./rhachet.dispatch.yml
 */
export const runGatherCommand = async (input: {
  configPath?: string;
  repoDir?: string;
}): Promise<BehaviorGathered[]> => {
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

  // gather behaviors
  const gathered = await getAllBehaviorGathered({ repoDir }, context);

  // output summary
  console.log(`gathered ${gathered.length} behaviors`);
  for (const behavior of gathered) {
    console.log(
      `  - ${behavior.behavior.name} (${behavior.status}) [${behavior.contentHash.slice(0, 8)}]`,
    );
  }

  return gathered;
};

// run if invoked directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const configPath = args.find((a) => a.startsWith('--config='))?.split('=')[1];
  const repoDir = args.find((a) => a.startsWith('--repo='))?.split('=')[1];

  runGatherCommand({ configPath, repoDir }).catch((error) => {
    console.error('gather failed:', error);
    process.exit(1);
  });
}
