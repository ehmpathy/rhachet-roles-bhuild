import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

/**
 * .what = did a push rewrite this record's request since the drain read it
 * .why = the drain sends the copy it read; a re-push that lands before it settles carries a
 *        request the send never saw, so the drain must not settle it as though it did
 *
 * .note = compares the fields a push sets (channel, auth, idem, and the body); the fate fields
 *         (recordStatus, reason, deliveredExid) and heldSeq are the drain's own, so a change
 *         there is no re-push
 */
export const isRadioTaskRecordRepushedSince = (input: {
  read: RadioTaskRecord;
  current: RadioTaskRecord;
}): boolean =>
  input.read.via !== input.current.via ||
  input.read.auth !== input.current.auth ||
  input.read.idem !== input.current.idem ||
  input.read.title !== input.current.title ||
  input.read.description !== input.current.description ||
  input.read.exid !== input.current.exid ||
  input.read.status !== input.current.status;
