import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';

import { asRadioPromiseHoldDetail } from '../promise/asRadioPromiseHoldDetail';
import { isRadioPromiseHoldReason } from '../promise/isRadioPromiseHoldReason';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = the fate a push reads from its own record, settled by another writer
 * .why = a concurrent drain may deliver or refuse this push, and a `queue del` may drop it,
 *        before this push's own drain runs; its record on disk then holds its fate, and a push
 *        must report that fate, never crash as though the drain lost it
 *
 * .note = total over RadioTaskRecordStatus: QUEUED alone has no settled fate, and returns null,
 *         so the caller can fail loud on a record no drain reached
 * .note = a record the promise gate dropped stores the machine code; its detail renders the
 *         human why from that code, never the raw code
 */
export const asRadioFateFromSettledRecord = (input: {
  record: RadioTaskRecord;
}):
  | RadioTaskRecordFate
  | { fate: 'landed'; record: RadioTaskRecord }
  | null => {
  const { record } = input;
  switch (record.recordStatus) {
    case RadioTaskRecordStatus.DELIVERED:
      return { fate: 'landed', record };
    case RadioTaskRecordStatus.REFUSED:
      return {
        fate: 'refused',
        record,
        detail: record.reason ?? 'refused upstream',
      };
    case RadioTaskRecordStatus.DROPPED:
      return {
        fate: 'refused',
        record,
        detail: isRadioPromiseHoldReason(record.reason)
          ? `dropped: ${asRadioPromiseHoldDetail({ reason: record.reason, cause: null })}`
          : (record.reason ?? 'dropped via radio.task.queue del'),
      };
    case RadioTaskRecordStatus.QUEUED:
      return null;
  }
};
