import type { IdempotencyMode } from '@src/domain.objects/IdempotencyMode';
import type { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import type { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import type { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

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

  return new RadioTaskRecord({
    key: input.key,
    kind: input.push.exid === null ? 'create' : 'update',
    ...input.push,
    description: input.push.description ?? input.before?.description ?? null,
    auth: input.push.auth ?? input.before?.auth ?? null,
    idem: input.push.idem ?? input.before?.idem ?? null,
    heldSeq: input.heldSeq,
    recordStatus: fate?.recordStatus ?? RadioTaskRecordStatus.QUEUED,
    reason: fate?.reason ?? null,
    deliveredExid: fate?.deliveredExid ?? null,
  });
};
