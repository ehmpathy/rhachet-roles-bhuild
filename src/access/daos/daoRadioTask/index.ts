import { UnexpectedCodePathError } from 'helpful-errors';

import { RadioChannel } from '../../../domain.objects/RadioChannel';
import type { RadioTask } from '../../../domain.objects/RadioTask';
import type { RadioTaskRepo } from '../../../domain.objects/RadioTaskRepo';
import type { RadioTaskStatus } from '../../../domain.objects/RadioTaskStatus';
import { daoRadioTaskViaGhIssues } from './daoRadioTaskViaGhIssues';
import { daoRadioTaskViaOsFileops } from './daoRadioTaskViaOsFileops';

/**
 * .what = dao interface for radio task persistence
 * .why = enables channel-agnostic task storage with declastruct pattern
 */
export interface DaoRadioTask {
  get: {
    one: {
      byPrimary(input: { exid: string }): Promise<RadioTask | null>;
      byUnique(input: {
        repo: RadioTaskRepo;
        title: string;
      }): Promise<RadioTask | null>;
    };
    all(input: {
      repo: RadioTaskRepo;
      filter?: { status?: RadioTaskStatus };
      limit?: number;
    }): Promise<RadioTask[]>;
  };
  set: {
    findsert(input: { task: RadioTask }): Promise<RadioTask>;
    upsert(input: { task: RadioTask }): Promise<RadioTask>;
  };
  del(input: { exid: string }): Promise<void>;
}

/**
 * .what = select dao adapter based on channel
 * .why = enables channel-specific persistence logic
 */
export const getDaoRadioTask = (input: {
  channel: RadioChannel;
  repo: RadioTaskRepo;
}): DaoRadioTask => {
  if (input.channel === RadioChannel.GH_ISSUES)
    return daoRadioTaskViaGhIssues({ repo: input.repo });
  if (input.channel === RadioChannel.OS_FILEOPS)
    return daoRadioTaskViaOsFileops({ repo: input.repo });
  throw new UnexpectedCodePathError('unknown channel', {
    channel: input.channel,
  });
};
