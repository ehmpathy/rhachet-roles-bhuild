import * as path from 'path';

import type { BehaviorWorkstream } from '../../domain.objects/BehaviorWorkstream';
import { getAllBehaviorCoordinated as getAllBehaviorCoordinatedOp } from '../../domain.operations/behavior/dispatch/coordinate/getAllBehaviorCoordinated';
import { getAllBehaviorDeptraced } from '../../domain.operations/behavior/dispatch/deptrace/getOneBehaviorDeptraced';
import { getAllBehaviorGathered } from '../../domain.operations/behavior/dispatch/gather/getAllBehaviorGathered';
import { genBehaviorDispatchContext } from '../../domain.operations/behavior/dispatch/genBehaviorDispatchContext';
import { getAllBehaviorMeasured } from '../../domain.operations/behavior/dispatch/measure/getOneBehaviorMeasured';
import { getAllBehaviorTriaged } from '../../domain.operations/behavior/dispatch/triage/getAllBehaviorTriaged';

/**
 * .what = CLI command for coordinating behaviors into workstreams
 * .why = enables running coordinate skill via command line
 *
 * @example
 * npx tsx ./src/contract/cli/getAllBehaviorCoordinated.ts --config ./rhachet.dispatch.yml
 */
export const runCoordinateCommand = async (input: {
  configPath?: string;
  repoDir?: string;
}): Promise<{
  workstreams: BehaviorWorkstream[];
  outputs: {
    coordinationMd: string;
    coordinationJson: string;
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
  console.log('🦫 lets coordinate!');
  console.log('│');

  // gather stage with timing
  const gatherStart = Date.now();
  console.log('├─ 🌲 gather behaviors');

  const gathered = await getAllBehaviorGathered({ repoDir }, context);
  const gatherDuration = ((Date.now() - gatherStart) / 1000).toFixed(1);

  console.log(`│  ├─ ✓ done in ${gatherDuration}s`);
  console.log(`│  └─ ${gathered.length} behaviors found`);
  console.log('│');

  // deptrace stage
  const deptraceStart = Date.now();
  console.log('├─ 🌲 deptrace dependencies');

  const deptraced = await getAllBehaviorDeptraced(
    { basket: gathered },
    context,
  );
  const deptraceDuration = ((Date.now() - deptraceStart) / 1000).toFixed(1);

  console.log(`│  ├─ ✓ done in ${deptraceDuration}s`);
  console.log(`│  └─ ${deptraced.length} behaviors traced`);
  console.log('│');

  // measure stage
  const measureStart = Date.now();
  console.log('├─ 🌲 measure behaviors');

  const measured = await getAllBehaviorMeasured(
    { gatheredBasket: gathered, deptracedBasket: deptraced },
    context,
  );
  const measureDuration = ((Date.now() - measureStart) / 1000).toFixed(1);

  console.log(`│  ├─ ✓ done in ${measureDuration}s`);
  console.log(`│  └─ ${measured.length} behaviors measured`);
  console.log('│');

  // triage stage
  const triageStart = Date.now();
  console.log('├─ 🌲 triage behaviors');

  const { behaviors: triaged, stats: triageStats } =
    await getAllBehaviorTriaged(
      { measuredBasket: measured, deptracedBasket: deptraced },
      context,
    );
  const triageDuration = ((Date.now() - triageStart) / 1000).toFixed(1);

  console.log(`│  ├─ ✓ done in ${triageDuration}s`);
  console.log(
    `│  └─ ${triageStats.now} now, ${triageStats.soon} soon, ${triageStats.later} later`,
  );
  console.log('│');

  // coordinate stage
  const coordinateStart = Date.now();
  console.log('├─ 🌲 coordinate workstreams');

  const result = await getAllBehaviorCoordinatedOp(
    { triagedBasket: triaged, deptracedBasket: deptraced },
    context,
  );
  const coordinateDuration = ((Date.now() - coordinateStart) / 1000).toFixed(1);

  // count bottlenecks (workstreams with blocked behaviors)
  const bottleneckCount = result.workstreams.filter((ws) =>
    ws.deliverables.some((d) => d.decision !== 'now'),
  ).length;

  console.log(`│  ├─ ✓ done in ${coordinateDuration}s`);
  console.log(
    `│  ├─ ${result.stats.deliverables} behaviors grouped into ${result.stats.workstreams} workstreams`,
  );
  console.log(
    `│  └─ ${bottleneckCount} bottleneck${bottleneckCount !== 1 ? 's' : ''} detected`,
  );
  console.log('│');

  // output
  console.log('└─ 🌊 output');
  console.log(`   ├─ ${result.outputs.coordinationMd}`);
  console.log(`   └─ ${result.outputs.coordinationJson}`);

  return result;
};

/**
 * .what = returns emoji for priority level
 * .why = visual differentiation of priority
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getPriorityEmoji = (priority: string): string => {
  switch (priority) {
    case 'p0':
      return '🔴';
    case 'p1':
      return '🟠';
    case 'p3':
      return '🟡';
    case 'p5':
      return '🟢';
    default:
      return '⚪';
  }
};

// run if invoked directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const configPath = args.find((a) => a.startsWith('--config='))?.split('=')[1];
  const repoDir = args.find((a) => a.startsWith('--repo='))?.split('=')[1];

  runCoordinateCommand({ configPath, repoDir }).catch((error) => {
    console.error('coordinate failed:', error);
    process.exit(1);
  });
}
