import { DomainEntity } from 'domain-objects';

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
   * what upstream said when it set this record aside, in its own words: one line, cut of the
   * echoed command (null when no fault holds it, or when its words held a clock or a token)
   *
   * .note = it explains `reason`, so every write that changes `reason` also sets or clears it
   *         (setRadioTaskRecordSettled clears it by default). a file written before the field
   *         reads back null, and a null is left out of the file, so its bytes never change
   */
  reasonHeadline: string | null;

  /**
   * place in line across the worktree: 1 + the highest heldSeq in any record dir; the drain order
   *
   * .note = a record holds no timestamp. a clock value changes on every run with no change
   *         in sense, so it would churn the diff of a tracked record
   *         (rule.forbid.timestamps-in-tracked-files). the order is this sequence; "when" is
   *         a question git answers
   */
  heldSeq: number;

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
    'reasonHeadline',
    'deliveredExid',
  ] as const;
  public static nested = { repo: RadioTaskRepo };
}

export { RadioTaskRecord };
