import { ConstraintError } from 'helpful-errors';

import type { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import type { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

/**
 * .what = validate and transform push args into task
 * .why  = a new task needs a title and a body before it is recorded;
 *         the check runs before the transcribe, so a malformed push never enters the ledger
 */
export const asPushTaskFromArgs = (input: {
  repo: RadioTaskRepo;
  exid: string | null;
  title: string | null;
  description: string | null;
  status: RadioTaskStatus | null;
}): {
  repo: RadioTaskRepo;
  exid: string | null;
  title: string | null;
  description: string | null;
  status: RadioTaskStatus | null;
} => {
  // validate: title required for new tasks, and not empty
  // .note = the fix rides in the message, never in metadata — helpful-errors prints metadata as a raw json block
  if (input.exid === null && !input.title) {
    throw new ConstraintError(
      '--title required for new tasks; add --title "..." or use --exid to update an extant task',
    );
  }

  // validate: description required for new tasks, before it is recorded
  if (input.exid === null && !input.description) {
    throw new ConstraintError(
      '--description required for new task; add --description "..." or pipe it via --description @stdin',
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
