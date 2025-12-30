import * as path from 'path';

import type { BehaviorTriaged } from '../../domain.objects/BehaviorTriaged';
import { getAllBehaviorGathered } from '../../domain.operations/behavior/dispatch/gather/getAllBehaviorGathered';
import { genBehaviorDispatchContext } from '../../domain.operations/behavior/dispatch/genBehaviorDispatchContext';
import { getAllBehaviorPrioritized as getAllBehaviorPrioritizedOp } from '../../domain.operations/behavior/dispatch/prioritize/getAllBehaviorPrioritized';

/**
 * .what = CLI command for prioritizing behaviors
 * .why = enables running prioritize skill via command line
 *
 * @example
 * npx tsx ./src/contract/cli/getAllBehaviorPrioritized.ts --config ./rhachet.dispatch.yml
 */
export const runPrioritizeCommand = async (input: {
  configPath?: string;
  repoDir?: string;
}): Promise<{
  behaviors: BehaviorTriaged[];
  outputs: {
    prioritizationMd: string;
    prioritizationJson: string;
    dependenciesMd: string;
  };
}> => {
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

  // header
  console.log('🦫 lets prioritize!');
  console.log('│');

  // gather stage with timing
  const gatherStart = Date.now();
  console.log('├─ 🌲 gather behaviors');

  const gathered = await getAllBehaviorGathered({ repoDir }, context);
  const gatherDuration = ((Date.now() - gatherStart) / 1000).toFixed(1);

  // count unique repos
  const repos = new Set(
    gathered.map((g) => `${g.behavior.org}/${g.behavior.repo}`),
  );

  console.log(`│  ├─ ✓ done in ${gatherDuration}s`);
  console.log(`│  ├─ ${repos.size} repos scanned`);
  console.log(`│  ├─ ${gathered.length} behaviors found`);
  console.log(`│  └─ ${gathered.length} behaviors changed`);

  // show changed behaviors (first 5 max)
  const changedToShow = gathered.slice(0, 5);
  for (const g of changedToShow) {
    console.log(`│     ├─ + ${g.behavior.name}`);
  }
  if (gathered.length > 5) {
    console.log(`│     └─ ... (${gathered.length - 5} more)`);
  }
  console.log('│');

  // deptrace stage
  const deptraceStart = Date.now();
  console.log('├─ 🌲 deptrace dependencies');

  // run prioritization (includes deptrace, measure, triage)
  const result = await getAllBehaviorPrioritizedOp(
    { gatheredBasket: gathered },
    context,
  );

  const deptraceDuration = ((Date.now() - deptraceStart) / 1000).toFixed(1);
  console.log(`│  ├─ ✓ done in ${deptraceDuration}s`);
  console.log(`│  ├─ ${gathered.length} behaviors traced`);
  console.log(`│  └─ ${gathered.length} new, 0 cached`);
  console.log('│');

  // measure stage
  console.log('├─ 🌲 measure behaviors');
  console.log(`│  ├─ ✓ done`);
  console.log(`│  ├─ ${gathered.length} behaviors measured`);
  console.log(`│  └─ ${gathered.length} new, 0 cached`);
  console.log('│');

  // triage stage
  console.log('├─ 🌲 triage behaviors');
  console.log(`│  ├─ ✓ done`);
  console.log(`│  ├─ ${gathered.length} behaviors triaged`);
  console.log(
    `│  └─ ${result.stats.now} now, ${result.stats.soon} soon, ${result.stats.later} later`,
  );
  console.log('│');

  // output
  console.log('└─ 🌊 output');
  console.log(`   ├─ ${result.outputs.prioritizationMd}`);
  console.log(`   ├─ ${result.outputs.prioritizationJson}`);
  console.log(`   └─ ${result.outputs.dependenciesMd}`);

  return result;
};

/**
 * .what = formats duration for display
 * .why = consistent timing output
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

// run if invoked directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const configPath = args.find((a) => a.startsWith('--config='))?.split('=')[1];
  const repoDir = args.find((a) => a.startsWith('--repo='))?.split('=')[1];

  runPrioritizeCommand({ configPath, repoDir }).catch((error) => {
    console.error('prioritize failed:', error);
    process.exit(1);
  });
}
