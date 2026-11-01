import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

/**
 * .what = write one clock-held record back without its clock fields, only if its file still holds what was read
 * .why = the shed reads every clock-held file first, then writes each back; a push that rewrote one file
 *        between the two would be lost to a blind write. a push never writes a clock field, so a file it
 *        rewrote needs no shed: skip it, and the push's bytes stand
 *
 * .note = the compare reads the file anew via the same reader, so both sides shed clock fields alike
 */
export const setRadioTaskRecordClockShedIfUnchanged = (input: {
  found: { record: RadioTaskRecord; dir: string };
}): { record: RadioTaskRecord | null } => {
  // re-read the file as it stands now
  const current = daoRadioTaskRecord.get.one.byUnique({
    dir: input.found.dir,
    key: input.found.record.key,
  });

  // skip a file another writer changed, or removed, since the shed read it
  const isUnchanged =
    current !== null &&
    JSON.stringify(current) === JSON.stringify(input.found.record);
  if (!isUnchanged) return { record: null };

  // write it back whole; the read already shed its clock fields
  return { record: daoRadioTaskRecord.set.upsert(input.found) };
};
