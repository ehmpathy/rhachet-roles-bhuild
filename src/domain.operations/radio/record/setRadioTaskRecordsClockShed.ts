import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

/**
 * .what = write back, without its clock fields, every record whose file a prior version stamped
 * .why = the drain rewrites each held record it walks, but never one already DELIVERED or
 *        REFUSED; without this, such a record keeps `heldAt` / `settledAt` in a tracked file forever
 *
 * .note = idempotent: a record is listed only while its file holds a clock field, so a second
 *         run finds naught and writes naught. a clean file is never touched.
 * .note = run under the drain lock (see setRadioTaskRecordsDrained), so two drains never rewrite
 *         one file at once
 */
export const setRadioTaskRecordsClockShed = (
  input: Record<string, never>,
  context: { cwd: string },
): { records: RadioTaskRecord[] } => {
  // find each record whose file still holds a clock field, across every record dir
  const found = daoRadioTaskRecord.get.allClockHeld({
    dirs: daoRadioTaskRecord.get.dirs({ cwd: context.cwd }),
  });

  // write each back whole; the read already shed its clock fields
  const records = found.map((entry) => daoRadioTaskRecord.set.upsert(entry));
  return { records };
};
