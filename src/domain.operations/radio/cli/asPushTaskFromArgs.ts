import { BadRequestError } from 'helpful-errors';

import type { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import type { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

/**
 * .what = task shape for push operation
 * .why  = validated task data ready for dispatch
 */
export interface PushTaskInput {
  repo: RadioTaskRepo;
  exid: string | null;
  title: string | null;
  description: string | null;
  status: RadioTaskStatus | null;
}

/**
 * .what = validate and transform push args into task
 * .why  = extracts title requirement validation from orchestrator
 */
export const asPushTaskFromArgs = (input: {
  repo: RadioTaskRepo;
  exid: string | null;
  title: string | null;
  description: string | null;
  status: RadioTaskStatus | null;
}): PushTaskInput => {
  // validate: title required for new tasks
  if (input.exid === null && input.title === null) {
    throw new BadRequestError(
      '--title required for new tasks; use --exid to update an extant task',
      { hint: 'add --title or use --exid to update an extant task' },
    );
  }

  return {
    repo: input.repo,
    exid: input.exid,
    title: input.title,
    description: input.description,
    status: input.status,
  };
};
