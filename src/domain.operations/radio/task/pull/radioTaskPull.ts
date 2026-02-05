import { BadRequestError } from 'helpful-errors';

import {
  type ContextDispatchRadio,
  daoRadioTaskViaGhIssues,
  daoRadioTaskViaOsFileops,
  isContextGithubAuth,
} from '../../../../access/daos/daoRadioTask';
import { RadioChannel } from '../../../../domain.objects/RadioChannel';
import type { RadioTask } from '../../../../domain.objects/RadioTask';
import type { RadioTaskRepo } from '../../../../domain.objects/RadioTaskRepo';
import type { RadioTaskStatus } from '../../../../domain.objects/RadioTaskStatus';
import { getRepoFromGitContext } from '../../../../infra/git/getRepoFromGitContext';
import { assure } from '../../../../infra/types/assure';
import { bootstrapRadioDir } from '../../bootstrap/bootstrapRadioDir';

/**
 * .what = list tasks from a channel
 * .why = enables discovery of available work
 */
export async function radioTaskPullAll<TChannel extends RadioChannel>(
  input: {
    via: TChannel;
    repo?: RadioTaskRepo;
    filter?: { status?: RadioTaskStatus };
    limit?: number;
  },
  context: ContextDispatchRadio<TChannel>,
): Promise<{ tasks: RadioTask[] }> {
  // resolve repo from git context if not provided
  const repo = input.repo ?? (await getRepoFromGitContext());
  if (!repo) {
    throw new BadRequestError('--repo required (not in a git repo)');
  }

  // fetch tasks via channel-specific dao
  const tasks =
    input.via === RadioChannel.GH_ISSUES
      ? await daoRadioTaskViaGhIssues.get.all(
          { repo, filter: input.filter, limit: input.limit },
          assure(isContextGithubAuth, context),
        )
      : await daoRadioTaskViaOsFileops.get.all(
          { repo, filter: input.filter, limit: input.limit },
          context,
        );

  return { tasks };
}

/**
 * .what = pull a specific task from a channel
 * .why = enables retrieval with optional auto-cache to local filesystem
 */
export async function radioTaskPullOne<TChannel extends RadioChannel>(
  input: {
    via: TChannel;
    repo?: RadioTaskRepo;
    ref: { exid: string } | { title: string };
  },
  context: ContextDispatchRadio<TChannel>,
): Promise<{ task: RadioTask; cached: boolean }> {
  // resolve repo from git context if not provided
  const repo = input.repo ?? (await getRepoFromGitContext());
  if (!repo) {
    throw new BadRequestError('--repo required (not in a git repo)');
  }

  // fetch by primary or unique ref via channel-specific dao
  const task =
    input.via === RadioChannel.GH_ISSUES
      ? 'exid' in input.ref
        ? await daoRadioTaskViaGhIssues.get.one.byPrimary(
            { exid: input.ref.exid },
            assure(isContextGithubAuth, context),
          )
        : await daoRadioTaskViaGhIssues.get.one.byUnique(
            { repo, title: input.ref.title },
            assure(isContextGithubAuth, context),
          )
      : 'exid' in input.ref
        ? await daoRadioTaskViaOsFileops.get.one.byPrimary(
            { exid: input.ref.exid },
            context,
          )
        : await daoRadioTaskViaOsFileops.get.one.byUnique(
            { repo, title: input.ref.title },
            context,
          );

  if (!task) {
    throw new BadRequestError('task not found on channel', { ref: input.ref });
  }

  // auto-cache to os.fileops if pulled from remote channel
  let cached = false;
  if (input.via !== RadioChannel.OS_FILEOPS) {
    await bootstrapRadioDir({ repo, cwd: process.cwd() });
    await daoRadioTaskViaOsFileops.set.findsert({ task }, { git: { repo } });
    cached = true;
  }

  return { task, cached };
}

/**
 * .what = unified pull entry point
 * .why = single function that handles both list and single-task modes
 */
export async function radioTaskPull<TChannel extends RadioChannel>(
  input:
    | {
        via: TChannel;
        repo?: RadioTaskRepo;
        all: { filter?: { status?: RadioTaskStatus }; limit?: number };
      }
    | {
        via: TChannel;
        repo?: RadioTaskRepo;
        one: { exid: string } | { title: string };
      },
  context: ContextDispatchRadio<TChannel>,
): Promise<{ tasks: RadioTask[] } | { task: RadioTask; cached: boolean }> {
  if ('all' in input) {
    return radioTaskPullAll(
      {
        via: input.via,
        repo: input.repo,
        filter: input.all.filter,
        limit: input.all.limit,
      },
      context,
    );
  }

  if ('one' in input) {
    return radioTaskPullOne(
      {
        via: input.via,
        repo: input.repo,
        ref: input.one,
      },
      context,
    );
  }

  throw new BadRequestError('either --all or --one required');
}
