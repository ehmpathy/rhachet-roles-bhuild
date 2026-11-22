import type { RadioTask } from '@src/domain.objects/RadioTask';

import { asTaskListLine } from './asTaskListLine';

/**
 * .what = format task list as tree-struct output
 * .why = consistent output for list operations
 */
export const asTaskListOutput = (input: {
  tasks: RadioTask[];
  via: string;
  auth: string | null;
}): string => {
  const { tasks, via, auth } = input;
  const header = auth
    ? `🎙️ tasks on ${via} (auth: ${auth}):`
    : `🎙️ tasks on ${via}:`;

  if (tasks.length === 0) {
    return `${header}\n   └─ (no tasks found)`;
  }

  const lastIndex = tasks.length - 1;
  const lines = tasks.map((task, index) =>
    asTaskListLine({ task, isLast: index === lastIndex }),
  );
  return `${header}\n${lines.join('\n')}`;
};
