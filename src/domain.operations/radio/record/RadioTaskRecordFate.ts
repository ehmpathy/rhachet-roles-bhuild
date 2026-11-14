import type { RadioTask } from '@src/domain.objects/RadioTask';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

/**
 * .what = what one record's send landed upstream: a task, or a comment
 * .why = a task send lands a task; a comment send lands a comment on a thread the radio may not
 *        have framed, so it carries no task
 *
 * .note = a comment's url is null on os.fileops, which has none
 */
export type RadioTaskRecordSent =
  | {
      exid: string;
      task: RadioTask;
      outcome: 'created' | 'found' | 'updated' | 'unchanged';
    }
  | {
      exid: string;
      comment: { url: string | null };
      outcome: 'posted' | 'kept';
    };

/**
 * .what = the fate of one record after an attempt to send it
 * .why = the drain reports each record by its fate; `halt` stops the drain
 *
 * .note = a delivered fate carries `task` for a create or an update, `comment` for a comment
 */
export type RadioTaskRecordFate =
  | {
      fate: 'delivered';
      record: RadioTaskRecord;
      task: RadioTask;
      outcome: 'created' | 'found' | 'updated' | 'unchanged';
    }
  | {
      fate: 'delivered';
      record: RadioTaskRecord;
      comment: { url: string | null };
      outcome: 'posted' | 'kept';
    }
  | { fate: 'refused'; record: RadioTaskRecord; detail: string }
  | {
      fate: 'held';
      record: RadioTaskRecord;
      lift: string | null;
      detail: string | null;
      halt: boolean;
    };
