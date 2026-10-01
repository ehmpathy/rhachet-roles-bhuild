import { DomainEntity } from 'domain-objects';
import type { IsoTimeStamp } from 'iso-time';

import type { IdempotencyMode } from './IdempotencyMode';
import type { RadioChannel } from './RadioChannel';
import type { RadioTaskRecordStatus } from './RadioTaskRecordStatus';
import { RadioTaskRepo } from './RadioTaskRepo';
import type { RadioTaskStatus } from './RadioTaskStatus';

/**
 * .what = one radio.task.push attempt, transcribed before the gate
 * .why = the local write is the transaction: a blocked push is held here,
 *        and the next push that gets through delivers it on its own terms
 */
interface RadioTaskRecord {
  /**
   * identity of the push: create = (repo, title), update = (repo, exid, status)
   */
  key: string;

  /**
   * create = a new task (--title); update = a change to an extant task (--exid)
   */
  kind: 'create' | 'update';

  /**
   * target repository
   */
  repo: RadioTaskRepo;

  /**
   * channel to deliver via
   */
  via: RadioChannel;

  /**
   * auth mode to deliver with (null = the channel default)
   */
  auth: string | null;

  /**
   * idempotency mode of a create (null = the channel default, findsert)
   */
  idem: IdempotencyMode | null;

  /**
   * task title (null for an update that leaves it as is)
   */
  title: string | null;

  /**
   * task description (null for an update that leaves it as is)
   */
  description: string | null;

  /**
   * external id of the task an update targets (null for a create)
   */
  exid: string | null;

  /**
   * task status an update sets (null for a create, or an update of text only)
   */
  status: RadioTaskStatus | null;

  /**
   * fate of this record: QUEUED | DELIVERED | REFUSED
   */
  recordStatus: RadioTaskRecordStatus;

  /**
   * why the record is held or refused (null once delivered)
   */
  reason: string | null;

  /**
   * when the push was first transcribed
   */
  heldAt: IsoTimeStamp;

  /**
   * place in line within its dir: 1 + the highest heldSeq there; the drain order
   *
   * .note = heldAt has one-second precision, so two pushes in one second would tie;
   *         the sequence keeps the push order the stamp cannot
   */
  heldSeq: number;

  /**
   * when the record settled as DELIVERED or REFUSED (null while held)
   */
  settledAt: IsoTimeStamp | null;

  /**
   * external id upstream assigned on delivery (null until delivered)
   */
  deliveredExid: string | null;
}

class RadioTaskRecord
  extends DomainEntity<RadioTaskRecord>
  implements RadioTaskRecord
{
  public static unique = ['key'] as const;
  public static updatable = [
    'via',
    'auth',
    'idem',
    'description',
    'recordStatus',
    'reason',
    'settledAt',
    'deliveredExid',
  ] as const;
  public static nested = { repo: RadioTaskRepo };
}

export { RadioTaskRecord };
