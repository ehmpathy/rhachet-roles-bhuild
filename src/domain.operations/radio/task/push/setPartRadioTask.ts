import { BadRequestError } from 'helpful-errors';
import type { IsoDateStamp } from 'iso-time';

import {
  type ContextDispatchRadio,
  daoRadioTaskViaGhIssues,
  daoRadioTaskViaOsFileops,
  isContextGithubAuth,
} from '../../../../access/daos/daoRadioTask';
import { RadioChannel } from '../../../../domain.objects/RadioChannel';
import { RadioTask } from '../../../../domain.objects/RadioTask';
import type { RadioTaskRepo } from '../../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../../domain.objects/RadioTaskStatus';
import { getCurrentActor } from '../../../../infra/git/getCurrentActor';
import { getCurrentBranch } from '../../../../infra/git/getCurrentBranch';
import { assure } from '../../../../infra/types/assure';

/**
 * .what = convert Date to IsoDateStamp
 * .why = format date for RadioTask fields
 */
const toIsoDateStamp = (date: Date): IsoDateStamp => {
  return date.toISOString().split('T')[0] as IsoDateStamp;
};

/**
 * .what = update a task on a channel (status, title, description)
 * .why = enables status transitions and partial updates with lifecycle validation
 */
export const setPartRadioTask = async <TChannel extends RadioChannel>(
  input: {
    via: TChannel;
    task: {
      repo: RadioTaskRepo;
      exid: string;
      title?: string;
      description?: string;
      status?: RadioTaskStatus;
    };
  },
  context: ContextDispatchRadio<TChannel>,
): Promise<{
  task: RadioTask;
  outcome: 'updated' | 'unchanged';
  backup?: string;
}> => {
  // fetch task by primary key via channel-specific dao
  const taskFound =
    input.via === RadioChannel.GH_ISSUES
      ? await daoRadioTaskViaGhIssues.get.one.byPrimary(
          { exid: input.task.exid },
          assure(isContextGithubAuth, context),
        )
      : await daoRadioTaskViaOsFileops.get.one.byPrimary(
          { exid: input.task.exid },
          context,
        );
  if (!taskFound) {
    throw new BadRequestError('task not found', { exid: input.task.exid });
  }

  // build updated task
  let taskUpdated = new RadioTask({ ...taskFound });
  let hasChanges = false;

  // handle title update
  if (input.task.title !== undefined && input.task.title !== taskFound.title) {
    taskUpdated = new RadioTask({ ...taskUpdated, title: input.task.title });
    hasChanges = true;
  }

  // handle description update
  if (
    input.task.description !== undefined &&
    input.task.description !== taskFound.description
  ) {
    taskUpdated = new RadioTask({
      ...taskUpdated,
      description: input.task.description,
    });
    hasChanges = true;
  }

  // handle status transition
  if (
    input.task.status !== undefined &&
    input.task.status !== taskFound.status
  ) {
    taskUpdated = await applyStatusTransition(
      {
        task: taskUpdated,
        statusBefore: taskFound.status,
        statusAfter: input.task.status,
      },
      context,
    );
    hasChanges = true;
  }

  // return early if no changes
  if (!hasChanges) {
    return { task: taskFound, outcome: 'unchanged' };
  }

  // upsert the updated task via channel-specific dao
  const task =
    input.via === RadioChannel.GH_ISSUES
      ? await daoRadioTaskViaGhIssues.set.upsert(
          { task: taskUpdated },
          assure(isContextGithubAuth, context),
        )
      : await daoRadioTaskViaOsFileops.set.upsert(
          { task: taskUpdated },
          context,
        );

  return { task, outcome: 'updated' };
};

/**
 * .what = apply status transition with lifecycle validation
 * .why = enforce QUEUED → CLAIMED → DELIVERED order and record metadata
 */
const applyStatusTransition = async (
  input: {
    task: RadioTask;
    statusBefore: RadioTaskStatus;
    statusAfter: RadioTaskStatus;
  },
  context: ContextDispatchRadio<RadioChannel>,
): Promise<RadioTask> => {
  const { task, statusBefore, statusAfter } = input;

  // QUEUED → CLAIMED
  if (
    statusBefore === RadioTaskStatus.QUEUED &&
    statusAfter === RadioTaskStatus.CLAIMED
  ) {
    const branch = await getCurrentBranch();
    const actor = await getCurrentActor(
      {},
      isContextGithubAuth(context)
        ? context
        : { github: { auth: { token: null, role: 'as-human' as const } } },
    );

    return new RadioTask({
      ...task,
      status: RadioTaskStatus.CLAIMED,
      claimedBy: actor,
      claimedAt: toIsoDateStamp(new Date()),
      branch,
    });
  }

  // CLAIMED → CLAIMED (re-claim by same branch = no-op, different branch = error)
  if (
    statusBefore === RadioTaskStatus.CLAIMED &&
    statusAfter === RadioTaskStatus.CLAIMED
  ) {
    const branch = await getCurrentBranch();
    if (task.branch !== branch) {
      throw new BadRequestError('task already claimed by different branch', {
        claimedBranch: task.branch,
        currentBranch: branch,
      });
    }
    // same branch re-claim is a no-op
    return task;
  }

  // CLAIMED → DELIVERED
  if (
    statusBefore === RadioTaskStatus.CLAIMED &&
    statusAfter === RadioTaskStatus.DELIVERED
  ) {
    return new RadioTask({
      ...task,
      status: RadioTaskStatus.DELIVERED,
      deliveredAt: toIsoDateStamp(new Date()),
    });
  }

  // QUEUED → DELIVERED (invalid: cannot deliver unclaimed task)
  if (
    statusBefore === RadioTaskStatus.QUEUED &&
    statusAfter === RadioTaskStatus.DELIVERED
  ) {
    throw new BadRequestError('cannot deliver unclaimed task', {
      exid: task.exid,
      status: statusBefore,
    });
  }

  // any transition to QUEUED is invalid (cannot un-claim)
  if (statusAfter === RadioTaskStatus.QUEUED) {
    throw new BadRequestError('cannot transition to QUEUED', {
      exid: task.exid,
      statusBefore,
      statusAfter,
    });
  }

  // DELIVERED → anything is invalid
  if (statusBefore === RadioTaskStatus.DELIVERED) {
    throw new BadRequestError('cannot transition from DELIVERED', {
      exid: task.exid,
      statusBefore,
      statusAfter,
    });
  }

  throw new BadRequestError('invalid status transition', {
    exid: task.exid,
    statusBefore,
    statusAfter,
  });
};
