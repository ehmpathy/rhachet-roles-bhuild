import type { BehaviorMeasured } from '../../../../domain.objects/BehaviorMeasured';
import type { BehaviorTriaged } from '../../../../domain.objects/BehaviorTriaged';

/**
 * .what = renders prioritization as markdown for human review
 * .why = enables visualization of prioritized behaviors by urgency
 */
export const renderBehaviorTriagedPrioritizationMd = (input: {
  triaged: BehaviorTriaged[];
  measured: BehaviorMeasured[];
  stats: {
    now: number;
    soon: number;
    later: number;
    total: number;
  };
}): string => {
  const lines: string[] = [];

  // header
  lines.push('# prioritization');
  lines.push('');

  // summary stats
  lines.push('## summary');
  lines.push('');
  lines.push(`- **total behaviors**: ${input.stats.total}`);
  lines.push(`- 🚀 **now** (ready + capacity): ${input.stats.now}`);
  lines.push(`- ⏳ **soon** (blocked or over capacity): ${input.stats.soon}`);
  lines.push(`- 📅 **later** (deferred): ${input.stats.later}`);
  lines.push('');

  // now section
  const nowBehaviors = input.triaged.filter((t) => t.decision === 'now');
  if (nowBehaviors.length > 0) {
    lines.push('## 🚀 now');
    lines.push('');
    lines.push('behaviors ready to start immediately:');
    lines.push('');
    renderBehaviorTable(nowBehaviors, input.measured, lines);
    lines.push('');
  }

  // soon section
  const soonBehaviors = input.triaged.filter((t) => t.decision === 'soon');
  if (soonBehaviors.length > 0) {
    lines.push('## ⏳ soon');
    lines.push('');
    lines.push('behaviors blocked by dependencies or capacity:');
    lines.push('');
    renderBehaviorTable(soonBehaviors, input.measured, lines);
    lines.push('');
  }

  // later section
  const laterBehaviors = input.triaged.filter((t) => t.decision === 'later');
  if (laterBehaviors.length > 0) {
    lines.push('## 📅 later');
    lines.push('');
    lines.push('behaviors deferred due to dependencies or capacity:');
    lines.push('');
    renderBehaviorTable(laterBehaviors, input.measured, lines);
    lines.push('');
  }

  // footer
  lines.push('---');
  lines.push(`*generated at ${new Date().toISOString()}*`);

  return lines.join('\n');
};

/**
 * .what = renders a table of triaged behaviors
 * .why = consistent formatting for each urgency section
 */
const renderBehaviorTable = (
  triaged: BehaviorTriaged[],
  measured: BehaviorMeasured[],
  lines: string[],
): void => {
  lines.push(
    '| behavior | repo | priority | gain(+$) | cost(-$) | effect(~$) | readiness | bandwidth |',
  );
  lines.push(
    '|----------|------|----------|----------|----------|------------|-----------|-----------|',
  );

  for (const t of triaged) {
    // find corresponding measured
    const m = measured.find(
      (m) =>
        m.gathered.behavior.name === t.gathered.behavior.name &&
        m.gathered.contentHash === t.gathered.contentHash,
    );

    const gainStr = m ? formatDollarsWithSign(m.gain.composite, '+') : 'n/a';
    const costStr = m ? formatDollarsWithSign(m.cost.composite, '-') : 'n/a';
    const effectStr = m ? formatDollarsWithSign(m.effect, '~') : 'n/a';
    const priorityEmoji = getPriorityEmoji(t.priority);
    const repo = `${t.gathered.behavior.org}/${t.gathered.behavior.repo}`;

    lines.push(
      `| ${t.gathered.behavior.name} | ${repo} | ${priorityEmoji} ${t.priority} | ${gainStr} | ${costStr} | ${effectStr} | ${t.dimensions.readiness} | ${t.dimensions.bandwidth} |`,
    );
  }
};

/**
 * .what = formats dollars with explicit sign prefix
 * .why = consistent currency formatting matching blackbox spec (+$6,360)
 */
const formatDollarsWithSign = (value: number, sign: string): string => {
  const absValue = Math.abs(value);
  const formatted = formatWithCommas(absValue);
  return `${sign}$${formatted}`;
};

/**
 * .what = formats number with comma separators
 * .why = readable large numbers (6360 → 6,360)
 */
const formatWithCommas = (value: number): string => {
  return value.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
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
