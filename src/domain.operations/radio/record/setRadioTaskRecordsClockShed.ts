import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { setRadioTaskRecordClockShedIfUnchanged } from './setRadioTaskRecordClockShedIfUnchanged';

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

  // write each back, unless a push rewrote its file since the read
  const records = found
    .map((entry) => setRadioTaskRecordClockShedIfUnchanged({ found: entry }))
    .flatMap(({ record }) => (record ? [record] : []));
  return { records };
};
