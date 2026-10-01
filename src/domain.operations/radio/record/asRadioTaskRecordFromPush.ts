import type { IsoTimeStamp } from 'iso-time';

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
 * .note = the push's own fields (channel, auth, body, status) always win.
 *         place in line (heldAt, heldSeq) is kept from the extant record, else the next.
 *         the fate (status, reason, settledAt, deliveredExid) is kept only when the push
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
  next: { heldAt: IsoTimeStamp; heldSeq: number };
}): RadioTaskRecord => {
  // the place in line: kept from the extant record, else the next
  const place = input.before ?? input.next;

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
    heldAt: place.heldAt,
    heldSeq: place.heldSeq,
    recordStatus: fate?.recordStatus ?? RadioTaskRecordStatus.QUEUED,
    reason: fate?.reason ?? null,
    settledAt: fate?.settledAt ?? null,
    deliveredExid: fate?.deliveredExid ?? null,
  });
};
