import type { RadioTask } from '@src/domain.objects/RadioTask';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

/**
 * .what = compose github issue title and body from RadioTask
 * .why = consistent format across all radio tasks on gh.issues
 */
export const composeTaskIntoGhIssues = (input: {
  task: RadioTask;
}): { title: string; body: string } => {
  const { task } = input;

  // compose title with radio emoji prefix
  const title = `🎙️ task - ${task.title}`;

  // compose tree section based on status
  const treeSection = (() => {
    if (task.status === RadioTaskStatus.DELIVERED && task.branch)
      return `🌲 tree delivered at ${task.branch}`;
    if (task.status === RadioTaskStatus.CLAIMED && task.branch)
      return `🌲 tree planted at ${task.branch}`;
    return '';
  })();

  // compose body with standard format
  const body = [
    '🦫🎙️   dispatch to foreman',
    '',
    '```',
    '💧 task enqueued',
    '   ├─ priority = ?',
    '   ├─ yieldage = ?',
    '   └─ leverage = ?',
    '```',
    '',
    treeSection,
    '',
    '**title**',
    '',
    task.title,
    '',
    '**description**',
    '',
    task.description,
  ]
    .filter((line) => line !== '' || treeSection !== '')
    .join('\n')
    .replace(/\n\n\n+/g, '\n\n')
    .trim();

  return { title, body };
};
