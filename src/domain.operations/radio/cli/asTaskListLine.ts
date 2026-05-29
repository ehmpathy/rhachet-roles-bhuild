import type { RadioTask } from '@src/domain.objects/RadioTask';

/**
 * .what = format task list item with tree prefix
 * .why = consistent tree-struct output for task list items
 */
export const asTaskListLine = (input: {
  task: RadioTask;
  isLast: boolean;
}): string => {
  const prefix = input.isLast ? '└─' : '├─';
  return `   ${prefix} [${input.task.status}] ${input.task.exid}: ${input.task.title}`;
};
