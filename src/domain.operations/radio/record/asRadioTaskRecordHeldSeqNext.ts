import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

/**
 * .what = the heldSeq that follows the highest among these records (1 when none)
 * .why = a new record takes the next seq, so pushes drain in push order, no clock read
 *
 * .note = a fold, not an argument spread: a large record dir never grows the call frame
 */
export const asRadioTaskRecordHeldSeqNext = (input: {
  records: { record: RadioTaskRecord }[];
}): number =>
  input.records.reduce(
    (seqMax, { record }) => Math.max(seqMax, record.heldSeq),
    0,
  ) + 1;
