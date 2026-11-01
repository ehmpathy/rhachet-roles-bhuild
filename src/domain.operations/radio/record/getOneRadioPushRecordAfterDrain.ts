import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';

import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = the record this push's fate is read from, after its drain
 * .why = drains run one at a time per worktree; a push held when it began may find its record
 *        settled by a concurrent drain ahead of it (delivered or refused), or dropped by a
 *        `queue del`, so its own drain never saw it held. the record on disk is then this
 *        push's fate
 *
 * .note = this reads, never sends. a re-send after the lock is released was a second write: for
 *         a status update, the stale update met an issue a later update had moved past, was
 *         refused, and flipped a DELIVERED record to REFUSED
 *
 * .note = a push already DELIVERED when it began is a re-push of a landed task (C3, C6); its
 *         record reads as landed as-is
 */
export const getOneRadioPushRecordAfterDrain = (input: {
  fates: RadioTaskRecordFate[];
  record: RadioTaskRecord;
  dir: string;
}): RadioTaskRecord => {
  // the drain carried this push, or the push began landed: its record stands
  const isCarried = input.fates.some(
    (fate) => fate.record.key === input.record.key,
  );
  const isLandedAtStart =
    input.record.recordStatus === RadioTaskRecordStatus.DELIVERED;
  if (isCarried || isLandedAtStart) return input.record;

  // another writer settled it — a concurrent drain delivered or refused it, or a `queue del`
  // dropped it: the record on disk holds its fate
  const recordNow = daoRadioTaskRecord.get.one.byUnique({
    dir: input.dir,
    key: input.record.key,
  });
  if (recordNow && recordNow.recordStatus !== RadioTaskRecordStatus.QUEUED)
    return recordNow;

  // still queued: leave it for the fail-loud check downstream
  return input.record;
};
