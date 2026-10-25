import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';

/**
 * .what = does this push put its record (back) in the queue
 * .why = a new push queues; a refused or dropped record re-queues, since a human re-ran it
 *        (F10, F4); a held record keeps its place, its amend applied; a delivered one
 *        re-queues only for a new body (only the body is compared)
 *
 * .note = a record's identity is its key — (repo, title) for a create, (repo, exid, status)
 *         for an update — so a new status is a new record, never a re-push of this one.
 *         a push with no body asks for no body change, so it never re-queues a delivered record
 */
export const isRadioTaskRecordRequeuedByPush = (input: {
  before: RadioTaskRecord | null;
  push: { description: string | null };
}): boolean => {
  // a new push, or one a human re-ran past a settled refusal or drop
  if (!input.before) return true;
  if (input.before.recordStatus === RadioTaskRecordStatus.REFUSED) return true;
  if (input.before.recordStatus === RadioTaskRecordStatus.DROPPED) return true;

  // a held record keeps its place in line
  if (input.before.recordStatus === RadioTaskRecordStatus.QUEUED) return false;

  // a delivered record re-queues only for a new body
  if (input.push.description === null) return false;
  return input.before.description !== input.push.description;
};
