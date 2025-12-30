import * as path from 'path';

import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import type { BehaviorGathered } from '../../../../domain.objects/BehaviorGathered';
import type { BehaviorTriaged } from '../../../../domain.objects/BehaviorTriaged';
import { getAllBehaviorDeptraced } from '../deptrace/getOneBehaviorDeptraced';
import { renderBehaviorDeptracedDependenciesMd } from '../deptrace/renderBehaviorDeptracedDependenciesMd';
import { getAllBehaviorMeasured } from '../measure/getOneBehaviorMeasured';
import { getAllBehaviorTriaged } from '../triage/getAllBehaviorTriaged';
import { renderBehaviorTriagedPrioritizationMd } from '../triage/renderBehaviorTriagedPrioritizationMd';
import { archiveBehaviorIfChanged } from './archiveBehaviorIfChanged';

/**
 * .what = composite skill: gather → deptrace → measure → triage with outputs
 * .why = provides full prioritization pipeline with file outputs
 */
export const getAllBehaviorPrioritized = async (
  input: {
    gatheredBasket: BehaviorGathered[];
  },
  context: BehaviorDispatchContext,
): Promise<{
  behaviors: BehaviorTriaged[];
  outputs: {
    prioritizationMd: string;
    prioritizationJson: string;
    dependenciesMd: string;
  };
  stats: {
    gathered: number;
    now: number;
    soon: number;
    later: number;
  };
}> => {
  // deptrace all gathered behaviors
  context.log.debug('deptrace: computing dependencies');
  const deptracedBasket = await getAllBehaviorDeptraced(
    { basket: input.gatheredBasket },
    context,
  );

  // measure all behaviors
  context.log.debug('measure: computing gain/cost/effect');
  const measuredBasket = await getAllBehaviorMeasured(
    { gatheredBasket: input.gatheredBasket, deptracedBasket },
    context,
  );

  // triage all behaviors
  context.log.debug('triage: computing readiness/bandwidth');
  const { behaviors: triagedBasket, stats: triageStats } =
    await getAllBehaviorTriaged({ measuredBasket, deptracedBasket }, context);

  // render outputs
  context.log.debug('render: generating output files');

  const prioritizationMdContent = renderBehaviorTriagedPrioritizationMd({
    triaged: triagedBasket,
    measured: measuredBasket,
    stats: triageStats,
  });

  const dependenciesMdContent = renderBehaviorDeptracedDependenciesMd({
    deptraced: deptracedBasket,
    basket: input.gatheredBasket,
  });

  const prioritizationJsonContent = JSON.stringify(
    triagedBasket.map((t) => {
      // find corresponding measured for gain/cost/effect
      const m = measuredBasket.find(
        (m) =>
          m.gathered.behavior.name === t.gathered.behavior.name &&
          m.gathered.contentHash === t.gathered.contentHash,
      );

      return {
        behavior: t.gathered.behavior.name,
        repo: `${t.gathered.behavior.org}/${t.gathered.behavior.repo}`,
        priority: t.priority,
        gain: m?.gain.composite ?? 0,
        cost: m?.cost.composite ?? 0,
        effect: m?.effect ?? 0,
        decision: t.decision,
        readiness: t.dimensions.readiness,
        bandwidth: t.dimensions.bandwidth,
      };
    }),
    null,
    2,
  );

  // write outputs with archiving
  const outputDir = context.config.output;

  const prioritizationMdPath = path.join(outputDir, 'prioritization.md');
  const prioritizationJsonPath = path.join(outputDir, 'prioritization.json');
  const dependenciesMdPath = path.join(outputDir, 'dependencies.md');

  await archiveBehaviorIfChanged(
    { filePath: prioritizationMdPath, newContent: prioritizationMdContent },
    context,
  );

  await archiveBehaviorIfChanged(
    { filePath: prioritizationJsonPath, newContent: prioritizationJsonContent },
    context,
  );

  await archiveBehaviorIfChanged(
    { filePath: dependenciesMdPath, newContent: dependenciesMdContent },
    context,
  );

  return {
    behaviors: triagedBasket,
    outputs: {
      prioritizationMd: prioritizationMdPath,
      prioritizationJson: prioritizationJsonPath,
      dependenciesMd: dependenciesMdPath,
    },
    stats: {
      gathered: input.gatheredBasket.length,
      now: triageStats.now,
      soon: triageStats.soon,
      later: triageStats.later,
    },
  };
};
