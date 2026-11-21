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
  // validate: an exid passed is not blank, or the record would key as an update and send as a create
  if (input.exid !== null && input.exid.trim() === '') {
    throw new ConstraintError(
      '--exid is empty; add --exid <issue number> to update an extant task, or omit --exid to create a new one',
    );
  }

  // validate: title required for new tasks, and not empty
  // .note = the fix rides in the message, never in metadata — helpful-errors prints metadata as a raw json block
  if (input.exid === null && !input.title?.trim()) {
    throw new ConstraintError(
      '--title required for new tasks; add --title "..." or use --exid to update an extant task',
    );
  }

  // validate: a title passed on an update is not blank, or the edit would wipe the issue's title
  if (input.title !== null && input.title.trim() === '') {
    throw new ConstraintError(
      '--title is empty; add --title "..." with the new title, or omit --title to leave the title as is',
    );
  }

  // validate: description required for new tasks, before it is recorded
  if (input.exid === null && input.description === null) {
    throw new ConstraintError(
      '--description required for new task; add --description "..." or pipe it via --description @stdin',
    );
  }

  // validate: a body passed on a new task is not blank; an empty pipe names the pipe, not the flag
  if (input.exid === null && input.description?.trim() === '') {
    throw new ConstraintError(
      '--description is empty; a new task needs a body: add --description "..." with the text, or pipe a body that is not empty via --description @stdin',
    );
  }

  // validate: a body passed on an update is not blank, or the edit would wipe the issue's text
  if (input.description !== null && input.description.trim() === '') {
    throw new ConstraintError(
      '--description is empty; add --description "..." with the body, pipe it via --description @stdin, or omit --description to leave the body as is',
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
