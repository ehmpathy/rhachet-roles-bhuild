import type { RadioTask } from '../../../../domain.objects/RadioTask';
import { RadioTaskStatus } from '../../../../domain.objects/RadioTaskStatus';

/**
 * .what = compose task file content with yaml frontmatter
 * .why = consistent format for local task files with machine-readable metadata
 */
export const composeTaskIntoOsFileops = (input: {
  task: RadioTask;
}): string => {
  const { task } = input;

  // compose yaml frontmatter
  const frontmatter = [
    '---',
    `exid: "${task.exid}"`,
    `title: "${task.title.replace(/"/g, '\\"')}"`,
    `status: ${task.status}`,
    `repo: "${task.repo.owner}/${task.repo.name}"`,
    `pushed_by: ${task.pushedBy}`,
    `pushed_at: ${task.pushedAt}`,
    `claimed_by: ${task.claimedBy ?? 'null'}`,
    `claimed_at: ${task.claimedAt ?? 'null'}`,
    `delivered_at: ${task.deliveredAt ?? 'null'}`,
    `branch: ${task.branch ?? 'null'}`,
    '---',
  ].join('\n');

  // compose tree section based on status
  const treeSection = (() => {
    if (task.status === RadioTaskStatus.DELIVERED && task.branch)
      return `🌲 tree delivered at ${task.branch}`;
    if (task.status === RadioTaskStatus.CLAIMED && task.branch)
      return `🌲 tree planted at ${task.branch}`;
    return '';
  })();

  // compose body (same format as gh.issues)
  const bodyLines = [
    '',
    `🎙️ task - ${task.title}`,
    '',
    '🦫  dispatch to foreman',
    '',
    '💧 task enqueued',
    '   ├─ priority = ?',
    '   ├─ yieldage = ?',
    '   └─ leverage = ?',
  ];

  if (treeSection) {
    bodyLines.push('', treeSection);
  }

  bodyLines.push('', '---', '', task.title, '', task.description);

  const body = bodyLines.join('\n');

  return `${frontmatter}${body}\n`;
};
