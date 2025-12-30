import * as path from 'path';

import type { BehaviorDeptraced } from '../../../../domain.objects/BehaviorDeptraced';
import type { BehaviorDispatchContext } from '../../../../domain.objects/BehaviorDispatchContext';
import type { BehaviorTriaged } from '../../../../domain.objects/BehaviorTriaged';
import type { BehaviorWorkstream } from '../../../../domain.objects/BehaviorWorkstream';
import { archiveBehaviorIfChanged } from '../prioritize/archiveBehaviorIfChanged';
import { groupBehaviorWorkstreams } from './groupBehaviorWorkstreams';
import { rankBehaviorWorkstreams } from './rankBehaviorWorkstreams';
import { renderBehaviorWorkstreamCoordinationMd } from './renderBehaviorWorkstreamCoordinationMd';

/**
 * .what = coordinates behaviors into ranked workstreams with outputs
 * .why = enables parallel execution and review ordering
 */
export const getAllBehaviorCoordinated = async (
  input: {
    triagedBasket: BehaviorTriaged[];
    deptracedBasket: BehaviorDeptraced[];
  },
  context: BehaviorDispatchContext,
): Promise<{
  workstreams: BehaviorWorkstream[];
  outputs: {
    coordinationMd: string;
    coordinationJson: string;
  };
  stats: {
    workstreams: number;
    deliverables: number;
  };
}> => {
  // group behaviors into workstreams
  context.log.debug('coordinate: grouping into workstreams');
  const grouped = groupBehaviorWorkstreams({
    triagedBasket: input.triagedBasket,
    deptracedBasket: input.deptracedBasket,
  });

  // rank workstreams
  context.log.debug('coordinate: ranking workstreams');
  const ranked = rankBehaviorWorkstreams({ workstreams: grouped });

  // render outputs
  context.log.debug('coordinate: generating output files');

  const coordinationMdContent = renderBehaviorWorkstreamCoordinationMd({
    workstreams: ranked,
  });

  const coordinationJsonContent = JSON.stringify(
    ranked.map((ws) => ({
      slug: ws.slug,
      name: ws.name,
      rank: ws.rank,
      priority: ws.priority,
      deliverables: ws.deliverables.map((d) => ({
        behavior: d.gathered.behavior.name,
        priority: d.priority,
        decision: d.decision,
      })),
    })),
    null,
    2,
  );

  // write outputs with archiving
  const outputDir = context.config.output;

  const coordinationMdPath = path.join(outputDir, 'coordination.md');
  const coordinationJsonPath = path.join(outputDir, 'coordination.json');

  await archiveBehaviorIfChanged(
    { filePath: coordinationMdPath, newContent: coordinationMdContent },
    context,
  );

  await archiveBehaviorIfChanged(
    { filePath: coordinationJsonPath, newContent: coordinationJsonContent },
    context,
  );

  // compute stats
  const totalDeliverables = ranked.reduce(
    (sum, ws) => sum + ws.deliverables.length,
    0,
  );

  return {
    workstreams: ranked,
    outputs: {
      coordinationMd: coordinationMdPath,
      coordinationJson: coordinationJsonPath,
    },
    stats: {
      workstreams: ranked.length,
      deliverables: totalDeliverables,
    },
  };
};
