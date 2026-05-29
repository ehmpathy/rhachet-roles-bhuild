import type { RadioTask } from '@src/domain.objects/RadioTask';

/**
 * .what = format single task detail as tree-struct output
 * .why = consistent output for single task operations (pull one, push)
 */
export const asTaskDetailOutput = (input: {
  task: RadioTask;
  via: string;
  outcome: string | null;
  cached: boolean | null;
}): string => {
  const { task, via, outcome, cached } = input;

  const header = outcome
    ? `🎙️ ${outcome}: ${task.title}`
    : `🎙️ task - ${task.title}`;

  // build lines immutably via filter for conditional entries
  const conditionalLines = [
    task.pushedBy !== undefined
      ? `   ├─ pushedBy: ${task.pushedBy ?? '(not set)'}`
      : null,
    task.pushedAt !== undefined
      ? `   ├─ pushedAt: ${task.pushedAt ?? '(not set)'}`
      : null,
    task.claimedBy != null ? `   ├─ claimedBy: ${task.claimedBy}` : null,
    task.claimedBy != null
      ? `   ├─ claimedAt: ${task.claimedAt ?? '(not set)'}`
      : null,
    task.branch != null ? `   ├─ branch: ${task.branch}` : null,
    cached ? `   └─ 📥 cached to local .radio/` : null,
    !cached ? `   └─ via: ${via}` : null,
  ].filter((line): line is string => line !== null);

  // build description lines for pull operations (no outcome means pull)
  const descriptionLines = !outcome
    ? ['', 'description:', task.description ?? '(no description)']
    : [];

  const lines = [
    header,
    `   ├─ exid: ${task.exid}`,
    `   ├─ status: ${task.status}`,
    `   ├─ repo: ${task.repo.owner}/${task.repo.name}`,
    ...conditionalLines,
    ...descriptionLines,
  ];

  return lines.join('\n');
};
