import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';

/**
 * .what = does this record still wait for the radio
 * .why = only a QUEUED record is held; a DELIVERED or REFUSED one is settled
 */
export const isRadioTaskRecordHeld = (input: {
  record: RadioTaskRecord;
}): boolean => input.record.recordStatus === RadioTaskRecordStatus.QUEUED;
