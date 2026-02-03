import { DomainEntity } from 'domain-objects';
import type { IsoDateStamp } from 'iso-time';

import { RadioTaskRepo } from './RadioTaskRepo';
import type { RadioTaskStatus } from './RadioTaskStatus';

/**
 * .what = a task broadcast via radio channel
 * .why = core entity for dispatcher radio system
 */
interface RadioTask {
  /**
   * external id (primary key from channel)
   */
  exid: string;

  /**
   * task title (unique within repo)
   */
  title: string;

  /**
   * task description (required context for execution)
   */
  description: string;

  /**
   * lifecycle status: QUEUED | CLAIMED | DELIVERED
   */
  status: RadioTaskStatus;

  /**
   * target repository for this task
   */
  repo: RadioTaskRepo;

  /**
   * who created the task
   */
  pushedBy: string;

  /**
   * when the task was created (iso date)
   */
  pushedAt: IsoDateStamp;

  /**
   * who claimed the task (null if unclaimed)
   */
  claimedBy: string | null;

  /**
   * when the task was claimed (null if unclaimed)
   */
  claimedAt: IsoDateStamp | null;

  /**
   * when the task was delivered (null if not delivered)
   */
  deliveredAt: IsoDateStamp | null;

  /**
   * git branch where work happens (null if unclaimed)
   */
  branch: string | null;
}

class RadioTask extends DomainEntity<RadioTask> implements RadioTask {
  public static primary = ['exid'] as const;
  public static unique = ['repo', 'title'] as const;
  public static updatable = [
    'title',
    'description',
    'status',
    'claimedBy',
    'claimedAt',
    'deliveredAt',
    'branch',
  ] as const;
  public static nested = { repo: RadioTaskRepo };
}

export { RadioTask };
