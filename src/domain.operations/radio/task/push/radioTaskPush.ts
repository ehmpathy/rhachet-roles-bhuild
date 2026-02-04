import { BadRequestError } from 'helpful-errors';

import type { IdempotencyMode } from '../../../../domain.objects/IdempotencyMode';
import { RadioChannel } from '../../../../domain.objects/RadioChannel';
import type { RadioTask } from '../../../../domain.objects/RadioTask';
import type { RadioTaskRepo } from '../../../../domain.objects/RadioTaskRepo';
import type { RadioTaskStatus } from '../../../../domain.objects/RadioTaskStatus';
import { getRepoFromGitContext } from '../../../../infra/git/getRepoFromGitContext';
import { bootstrapRadioDir } from '../../bootstrap/bootstrapRadioDir';
import { setFullRadioTask } from './setFullRadioTask';
import { setPartRadioTask } from './setPartRadioTask';

/**
 * .what = dispatch to setFullRadioTask or setPartRadioTask
 * .why = single entry point for cli that routes based on input shape
 */
export const radioTaskPush = async (input: {
  via: RadioChannel;
  idem?: IdempotencyMode;
  task: {
    repo?: RadioTaskRepo;
    exid?: string;
    title?: string;
    description?: string;
    status?: RadioTaskStatus;
  };
}): Promise<{
  task: RadioTask;
  outcome: 'created' | 'found' | 'updated' | 'unchanged';
  backup?: string;
}> => {
  // resolve repo from git context if not provided
  const repo = input.task.repo ?? (await getRepoFromGitContext());
  if (!repo) {
    throw new BadRequestError('--repo required (not in a git repo)');
  }

  // bootstrap radio dir for os.fileops
  if (input.via === RadioChannel.OS_FILEOPS) {
    await bootstrapRadioDir({ repo, cwd: process.cwd() });
  }

  // dispatch to setPartRadioTask if exid provided (update mode)
  if (input.task.exid) {
    return setPartRadioTask({
      via: input.via,
      task: {
        repo,
        exid: input.task.exid,
        title: input.task.title,
        description: input.task.description,
        status: input.task.status,
      },
    });
  }

  // validate required fields for new task
  if (!input.task.title) {
    throw new BadRequestError('--title required for new task');
  }
  if (!input.task.description) {
    throw new BadRequestError('--description required for new task');
  }

  // dispatch to setFullRadioTask (create mode)
  return setFullRadioTask({
    via: input.via,
    idem: input.idem,
    task: {
      repo,
      title: input.task.title,
      description: input.task.description,
    },
  });
};
