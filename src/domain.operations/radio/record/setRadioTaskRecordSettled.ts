import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { isRadioTaskRecordRepushedSince } from './isRadioTaskRecordRepushedSince';

/**
 * .what = persist the fate the drain gave a record, unless a re-push rewrote it since the read
 * .why = the push transcribe runs outside the drain lock, so a re-push can land while the drain
 *        works its line; a write of the stale line copy would put the old body back. so a
 *        re-pushed record is left as the re-push wrote it, QUEUED, for the re-push's own drain
 *
 * .note = the one writer for every drain-side fate (held at gate, held behind halt, set aside,
 *         refused, delivered). its read and write are adjacent, so the window left is
 *         microseconds, not the length of a send
 */
export const setRadioTaskRecordSettled = (input: {
  dir: string;
  record: RadioTaskRecord;
  change: Partial<RadioTaskRecord>;
}): RadioTaskRecord => {
  // a re-push since the read: leave its request queued, for its own drain
  const current = daoRadioTaskRecord.get.one.byUnique({
    dir: input.dir,
    key: input.record.key,
  });
  if (
    current &&
    isRadioTaskRecordRepushedSince({ read: input.record, current })
  )
    return current;

  // settle the record the drain read
  return daoRadioTaskRecord.set.upsert({
    dir: input.dir,
    record: new RadioTaskRecord({ ...input.record, ...input.change }),
  });
};
