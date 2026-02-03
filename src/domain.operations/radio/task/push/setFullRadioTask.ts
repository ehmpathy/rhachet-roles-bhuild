import type { IsoDateStamp } from 'iso-time';

import { getDaoRadioTask } from '../../../../access/daos/daoRadioTask';
import { IdempotencyMode } from '../../../../domain.objects/IdempotencyMode';
import type { RadioChannel } from '../../../../domain.objects/RadioChannel';
import { RadioTask } from '../../../../domain.objects/RadioTask';
import type { RadioTaskRepo } from '../../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../../domain.objects/RadioTaskStatus';
import { getCurrentActor } from '../../../../infra/git/getCurrentActor';

/**
 * .what = convert Date to IsoDateStamp
 * .why = format date for RadioTask fields
 */
const toIsoDateStamp = (date: Date): IsoDateStamp => {
  return date.toISOString().split('T')[0] as IsoDateStamp;
};

/**
 * .what = create a new task on a channel
 * .why = enables broadcast of new tasks with full required data
 */
export const setFullRadioTask = async (input: {
  via: RadioChannel;
  idem?: IdempotencyMode;
  task: {
    repo: RadioTaskRepo;
    title: string;
    description: string;
  };
}): Promise<{
  task: RadioTask;
  outcome: 'created' | 'found';
}> => {
  const dao = getDaoRadioTask({ channel: input.via, repo: input.task.repo });

  // get current actor for pushedBy
  const pushedBy = await getCurrentActor();

  // build full task object
  const taskToCreate = new RadioTask({
    exid: '', // will be set by dao
    title: input.task.title,
    description: input.task.description,
    status: RadioTaskStatus.QUEUED,
    repo: input.task.repo,
    pushedBy,
    pushedAt: toIsoDateStamp(new Date()),
    claimedBy: null,
    claimedAt: null,
    deliveredAt: null,
    branch: null,
  });

  // determine idempotency mode
  const idem = input.idem ?? IdempotencyMode.FINDSERT;

  if (idem === IdempotencyMode.FINDSERT) {
    // check if task already exists
    const taskFound = await dao.get.one.byUnique({
      repo: input.task.repo,
      title: input.task.title,
    });
    if (taskFound) {
      return { task: taskFound, outcome: 'found' };
    }
  }

  // create or upsert the task
  const task =
    idem === IdempotencyMode.UPSERT
      ? await dao.set.upsert({ task: taskToCreate })
      : await dao.set.findsert({ task: taskToCreate });

  return { task, outcome: 'created' };
};
