import { BadRequestError } from 'helpful-errors';

import { getDaoRadioTask } from '../../../../access/daos/daoRadioTask';
import { RadioChannel } from '../../../../domain.objects/RadioChannel';
import type { RadioTask } from '../../../../domain.objects/RadioTask';
import type { RadioTaskRepo } from '../../../../domain.objects/RadioTaskRepo';
import type { RadioTaskStatus } from '../../../../domain.objects/RadioTaskStatus';
import { getRepoFromGitContext } from '../../../../infra/git/getRepoFromGitContext';
import { bootstrapRadioDir } from '../../bootstrap/bootstrapRadioDir';

/**
 * .what = list tasks from a channel
 * .why = enables discovery of available work
 */
export async function radioTaskPullAll(input: {
  via: RadioChannel;
  repo?: RadioTaskRepo;
  filter?: { status?: RadioTaskStatus };
  limit?: number;
}): Promise<{ tasks: RadioTask[] }> {
  // resolve repo from git context if not provided
  const repo = input.repo ?? (await getRepoFromGitContext());
  if (!repo) {
    throw new BadRequestError('--repo required (not in a git repo)');
  }

  const dao = getDaoRadioTask({ channel: input.via, repo });

  const tasks = await dao.get.all({
    repo,
    filter: input.filter,
    limit: input.limit,
  });

  return { tasks };
}

/**
 * .what = pull a specific task from a channel
 * .why = enables retrieval with optional auto-cache to local filesystem
 */
export async function radioTaskPullOne(input: {
  via: RadioChannel;
  repo?: RadioTaskRepo;
  ref: { exid: string } | { title: string };
}): Promise<{ task: RadioTask; cached: boolean }> {
  // resolve repo from git context if not provided
  const repo = input.repo ?? (await getRepoFromGitContext());
  if (!repo) {
    throw new BadRequestError('--repo required (not in a git repo)');
  }

  const dao = getDaoRadioTask({ channel: input.via, repo });

  // fetch by primary or unique ref
  const task =
    'exid' in input.ref
      ? await dao.get.one.byPrimary({ exid: input.ref.exid })
      : await dao.get.one.byUnique({ repo, title: input.ref.title });

  if (!task) {
    throw new BadRequestError('task not found on channel', { ref: input.ref });
  }

  // auto-cache to os.fileops if pulled from remote channel
  let cached = false;
  if (input.via !== RadioChannel.OS_FILEOPS) {
    await bootstrapRadioDir({ repo, cwd: process.cwd() });
    const localDao = getDaoRadioTask({
      channel: RadioChannel.OS_FILEOPS,
      repo,
    });
    await localDao.set.findsert({ task });
    cached = true;
  }

  return { task, cached };
}

/**
 * .what = unified pull entry point
 * .why = single function that handles both list and single-task modes
 */
export async function radioTaskPull(
  input:
    | {
        via: RadioChannel;
        repo?: RadioTaskRepo;
        all: { filter?: { status?: RadioTaskStatus }; limit?: number };
      }
    | {
        via: RadioChannel;
        repo?: RadioTaskRepo;
        one: { exid: string } | { title: string };
      },
): Promise<{ tasks: RadioTask[] } | { task: RadioTask; cached: boolean }> {
  if ('all' in input) {
    return radioTaskPullAll({
      via: input.via,
      repo: input.repo,
      filter: input.all.filter,
      limit: input.all.limit,
    });
  }

  if ('one' in input) {
    return radioTaskPullOne({
      via: input.via,
      repo: input.repo,
      ref: input.one,
    });
  }

  throw new BadRequestError('either --all or --one required');
}
