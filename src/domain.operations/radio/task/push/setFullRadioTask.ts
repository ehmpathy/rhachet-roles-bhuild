import type { IsoDateStamp } from 'iso-time';

import {
  type ContextDispatchRadio,
  daoRadioTaskViaGhIssues,
  daoRadioTaskViaOsFileops,
  isContextGithubAuth,
} from '../../../../access/daos/daoRadioTask';
import { IdempotencyMode } from '../../../../domain.objects/IdempotencyMode';
import { RadioChannel } from '../../../../domain.objects/RadioChannel';
import { RadioTask } from '../../../../domain.objects/RadioTask';
import type { RadioTaskRepo } from '../../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../../domain.objects/RadioTaskStatus';
import { getCurrentActor } from '../../../../infra/git/getCurrentActor';
import { assure } from '../../../../infra/types/assure';

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
export const setFullRadioTask = async <TChannel extends RadioChannel>(
  input: {
    via: TChannel;
    idem?: IdempotencyMode;
    task: {
      repo: RadioTaskRepo;
      title: string;
      description: string;
    };
  },
  context: ContextDispatchRadio<TChannel>,
): Promise<{
  task: RadioTask;
  outcome: 'created' | 'found';
}> => {
  // get current actor for pushedBy
  const pushedBy = await getCurrentActor(
    {},
    isContextGithubAuth(context)
      ? context
      : { github: { auth: { token: null, role: 'as-human' as const } } },
  );

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
    // check if task already exists via channel-specific dao
    const taskFound =
      input.via === RadioChannel.GH_ISSUES
        ? await daoRadioTaskViaGhIssues.get.one.byUnique(
            { repo: input.task.repo, title: input.task.title },
            assure(isContextGithubAuth, context),
          )
        : await daoRadioTaskViaOsFileops.get.one.byUnique(
            { repo: input.task.repo, title: input.task.title },
            context,
          );
    if (taskFound) {
      return { task: taskFound, outcome: 'found' };
    }
  }

  // create or upsert the task via channel-specific dao
  const task =
    input.via === RadioChannel.GH_ISSUES
      ? idem === IdempotencyMode.UPSERT
        ? await daoRadioTaskViaGhIssues.set.upsert(
            { task: taskToCreate },
            assure(isContextGithubAuth, context),
          )
        : await daoRadioTaskViaGhIssues.set.findsert(
            { task: taskToCreate },
            assure(isContextGithubAuth, context),
          )
      : idem === IdempotencyMode.UPSERT
        ? await daoRadioTaskViaOsFileops.set.upsert(
            { task: taskToCreate },
            context,
          )
        : await daoRadioTaskViaOsFileops.set.findsert(
            { task: taskToCreate },
            context,
          );

  return { task, outcome: 'created' };
};
