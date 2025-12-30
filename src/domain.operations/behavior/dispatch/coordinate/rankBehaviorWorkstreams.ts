import {
  BehaviorWorkstream,
  type BehaviorWorkstreamRank,
} from '../../../../domain.objects/BehaviorWorkstream';

/**
 * .what = assigns ranks to workstreams based on priority and effect
 * .why = enables execution ordering and review prioritization
 *
 * ranking logic:
 * - workstreams with higher priority behaviors rank higher
 * - within same priority, workstreams with more deliverables rank higher
 */
export const rankBehaviorWorkstreams = (input: {
  workstreams: BehaviorWorkstream[];
}): BehaviorWorkstream[] => {
  // sort workstreams by priority then deliverable count
  const sorted = [...input.workstreams].sort((a, b) => {
    // first by priority level (p0 > p1 > p3 > p5)
    const priorityOrder = { p0: 0, p1: 1, p3: 2, p5: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // then by number of deliverables (more = higher rank)
    return b.deliverables.length - a.deliverables.length;
  });

  // assign ranks
  return sorted.map((workstream, index) => {
    return new BehaviorWorkstream({
      ...workstream,
      rank: `r${index + 1}` as BehaviorWorkstreamRank,
    });
  });
};
