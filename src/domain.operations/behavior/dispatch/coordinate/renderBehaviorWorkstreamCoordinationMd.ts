import type { BehaviorWorkstream } from '../../../../domain.objects/BehaviorWorkstream';

/**
 * .what = renders workstream coordination as markdown for human review
 * .why = enables visualization of execution order and parallel work
 */
export const renderBehaviorWorkstreamCoordinationMd = (input: {
  workstreams: BehaviorWorkstream[];
}): string => {
  const lines: string[] = [];

  // header
  lines.push('# coordination');
  lines.push('');

  // summary stats
  const totalDeliverables = input.workstreams.reduce(
    (sum, ws) => sum + ws.deliverables.length,
    0,
  );

  lines.push('## summary');
  lines.push('');
  lines.push(`- **total workstreams**: ${input.workstreams.length}`);
  lines.push(`- **total deliverables**: ${totalDeliverables}`);
  lines.push('');

  // priority distribution
  const byPriority = {
    p0: input.workstreams.filter((ws) => ws.priority === 'p0').length,
    p1: input.workstreams.filter((ws) => ws.priority === 'p1').length,
    p3: input.workstreams.filter((ws) => ws.priority === 'p3').length,
    p5: input.workstreams.filter((ws) => ws.priority === 'p5').length,
  };

  lines.push('### priority distribution');
  lines.push('');
  lines.push(`- 🔴 p0 (critical): ${byPriority.p0}`);
  lines.push(`- 🟠 p1 (high): ${byPriority.p1}`);
  lines.push(`- 🟡 p3 (medium): ${byPriority.p3}`);
  lines.push(`- 🟢 p5 (low): ${byPriority.p5}`);
  lines.push('');

  // workstream details - use numbered list format per blackbox spec
  for (const ws of input.workstreams) {
    const priorityLabel = getPriorityLabel(ws.priority);

    lines.push(`## rank ${ws.rank}: ${ws.name}`);
    lines.push(`priority: ${ws.priority} (${priorityLabel})`);
    lines.push('');

    let stepNum = 1;
    for (const d of ws.deliverables) {
      const decisionTag = getDecisionTag(d.decision, stepNum);
      lines.push(
        `${stepNum}. [${decisionTag}] ${d.gathered.behavior.name} (${d.gathered.behavior.org}/${d.gathered.behavior.repo})`,
      );
      stepNum++;
    }

    lines.push('');
  }

  // bottlenecks section
  lines.push('## bottlenecks');
  lines.push('');

  const bottlenecks: string[] = [];
  for (const ws of input.workstreams) {
    // find blocked deliverables in this workstream
    const blockedDeliverables = ws.deliverables.filter(
      (d) => d.decision !== 'now',
    );

    if (blockedDeliverables.length > 0) {
      for (const blocked of blockedDeliverables) {
        // find what it's blocked by (first now deliverable in same workstream)
        const blocker = ws.deliverables.find((d) => d.decision === 'now');
        if (blocker) {
          bottlenecks.push(
            `- rank ${ws.rank} blocked: ${blocked.gathered.behavior.name} depends on ${blocker.gathered.behavior.name}`,
          );
        }
      }
    }
  }

  if (bottlenecks.length === 0) {
    lines.push('no bottlenecks detected - all behaviors are unblocked.');
  } else {
    for (const b of bottlenecks) {
      lines.push(b);
    }
  }
  lines.push('');

  // review order section
  lines.push('## review order');
  lines.push('');
  lines.push(
    'if multiple workstreams blocked on human review, review in rank order:',
  );

  for (const ws of input.workstreams) {
    const priorityLabel = getPriorityLabel(ws.priority);
    lines.push(
      `${ws.rank}. rank ${ws.rank} (${ws.priority} = ${priorityLabel})`,
    );
  }
  lines.push('');

  return lines.join('\n');
};

/**
 * .what = returns emoji for priority level
 * .why = visual differentiation of priority
 */
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

/**
 * .what = returns human-readable priority label
 * .why = explains priority level meaning
 */
const getPriorityLabel = (priority: string): string => {
  switch (priority) {
    case 'p0':
      return 'critical';
    case 'p1':
      return 'important';
    case 'p3':
      return 'desired';
    case 'p5':
      return 'nice-to-have';
    default:
      return 'unknown';
  }
};

/**
 * .what = returns decision tag with blocking info
 * .why = shows execution order status per blackbox spec
 */
const getDecisionTag = (decision: string, stepNum: number): string => {
  switch (decision) {
    case 'now':
      return 'now';
    case 'soon':
      return `blocked by #${stepNum - 1}`;
    case 'later':
      return `blocked by #${stepNum - 1}`;
    default:
      return decision;
  }
};
