import type { IdempotencyMode } from '@src/domain.objects/IdempotencyMode';
import type { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import type { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import type { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { isRadioTaskWithText } from '../promise/isRadioTaskWithText';
import { isRadioTaskRecordDroppedForPromise } from './isRadioTaskRecordDroppedForPromise';
import { isRadioTaskRecordRequeuedByPush } from './isRadioTaskRecordRequeuedByPush';

/**
 * .what = the record a push transcribes into, given the extant record for its identity
 * .why = one place states what a re-push keeps and what it resets
 *
 * .note = the push's channel and status always win. its auth, body, and idem win when the
 *         push names them; a push that omits one keeps the extant value, so a bare retry never
 *         undoes a `queue set --auth` amend or wipes the body.
 *         heldSeq is the record's place in line: setRadioTaskRecordFromPush mints it once, and
 *         keeps it on every later push; no push and no drain ever changes it. so a re-push
 *         compare (isRadioTaskRecordRepushedSince) leaves it out, with the drain's own fields.
 *         the fate (status, reason, deliveredExid) is kept only when the push
 *         does not re-queue it (see isRadioTaskRecordRequeuedByPush); else it resets to QUEUED
 * .note = the promise is the push's own, and only when the push passed a title or a body and
 *         the record inherits no body: a promise vouches for the text it came with, so a
 *         title-only push over an inherited body stores none, and the gate still reads the repo.
 *         a body the promise gate dropped is not inherited at all, so a status-only re-run
 *         sends status alone
 */
export const asRadioTaskRecordFromPush = (input: {
  key: string;
  push: {
    repo: RadioTaskRepo;
    via: RadioChannel;
    auth: string | null;
    idem: IdempotencyMode | null;
    title: string | null;
    description: string | null;
    exid: string | null;
    status: RadioTaskStatus | null;
    promise: string | null;
  };
  before: RadioTaskRecord | null;
  heldSeq: number;
}): RadioTaskRecord => {
  // the fate: kept unless this push re-queues the record
  const isRequeue = isRadioTaskRecordRequeuedByPush({
    before: input.before,
    push: input.push,
  });
  const fate = isRequeue || !input.before ? null : input.before;

  // a body the promise gate refused is not carried into a later push: it was never sent
  const isBeforeDroppedForPromise =
    input.before !== null && isRadioTaskRecordDroppedForPromise(input.before);
  const descriptionInherited = isBeforeDroppedForPromise
    ? null
    : (input.before?.description ?? null);

  // a promise vouches only when this push passed every text the record will carry:
  // never on a no-text push, never over a body inherited from an earlier push (fail closed)
  const hasTextOwn = isRadioTaskWithText(input.push);
  const hasBodyInherited =
    input.push.description === null && descriptionInherited !== null;
  const promise = hasTextOwn && !hasBodyInherited ? input.push.promise : null;

  return new RadioTaskRecord({
    key: input.key,
    kind: input.push.exid === null ? 'create' : 'update',
    ...input.push,
    promise,
    description: input.push.description ?? descriptionInherited,
    auth: input.push.auth ?? input.before?.auth ?? null,
    idem: input.push.idem ?? input.before?.idem ?? null,
    heldSeq: input.heldSeq,
    recordStatus: fate?.recordStatus ?? RadioTaskRecordStatus.QUEUED,
    reason: fate?.reason ?? null,
    deliveredExid: fate?.deliveredExid ?? null,
  });
};
