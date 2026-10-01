import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';

/**
 * .what = does this push put its record (back) in the queue
 * .why = a new push is queued; a verbatim re-push of a delivered task is a no-op (C3);
 *        a re-push that changes the body is a new request, and upstream decides it
 *        (findsert finds, upsert updates); a refused record re-queues, since a human
 *        re-ran it on purpose (F10)
 */
export const isRadioTaskRecordRequeuedByPush = (input: {
  before: RadioTaskRecord | null;
  push: { description: string | null };
}): boolean => {
  if (!input.before) return true;
  if (input.before.recordStatus === RadioTaskRecordStatus.REFUSED) return true;
  if (input.before.recordStatus !== RadioTaskRecordStatus.DELIVERED)
    return false;
  return input.before.description !== input.push.description;
};
