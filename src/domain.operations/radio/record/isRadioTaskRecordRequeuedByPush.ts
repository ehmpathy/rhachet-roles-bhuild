import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';

/**
 * .what = does this push put its record (back) in the queue
 * .why = a new push queues; a refused or dropped record re-queues on ANY push of the same task,
 *        bodyless or not (F10, F4); a held record keeps its place, its amend applied; a delivered
 *        one re-queues only for a new body (only the body is compared)
 *
 * .note = a drop is provisional by design: it stops this record, not the task. a push cannot
 *         tell a human re-run from a clone retry, so to keep a task out, the caller stops the
 *         push; `queue del` says so in its output ("a re-push of the same task queues it again")
 * .note = a record's identity is its key — (repo, title) for a create, (repo, exid, status)
 *         for an update — so a new status is a new record, never a re-push of this one.
 *         a push with no body asks for no body change, so it never re-queues a delivered record
 * .note = the switch is exhaustive: a new record status fails the type check here
 */
export const isRadioTaskRecordRequeuedByPush = (input: {
  before: RadioTaskRecord | null;
  push: { description: string | null };
}): boolean => {
  // a new push queues
  if (!input.before) return true;

  // decide by the extant record's fate
  const status = input.before.recordStatus;
  switch (status) {
    // a push of the same task re-runs it past a settled refusal or drop
    case RadioTaskRecordStatus.REFUSED:
    case RadioTaskRecordStatus.DROPPED:
      return true;

    // a held record keeps its place in line
    case RadioTaskRecordStatus.QUEUED:
      return false;

    // a delivered record re-queues only for a new body
    case RadioTaskRecordStatus.DELIVERED:
      if (input.push.description === null) return false;
      return input.before.description !== input.push.description;

    // unreachable while the switch covers every status
    default: {
      const statusUnknown: never = status;
      throw new Error(`unknown record status: ${String(statusUnknown)}`);
    }
  }
};
