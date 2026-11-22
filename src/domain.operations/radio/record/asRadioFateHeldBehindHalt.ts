import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioTaskRecordSettled } from './asRadioTaskRecordSettled';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = the fate of a record in line behind an upstream fault: held, unsent
 * .why = a fault that halts the drain likely hits every record after it, so each
 *        stays held in its place, and reports the fault's reason, never a reorder
 *
 * .note = the reason moves with no words of its own, so the settle rule clears any old words;
 *         this record never met the upstream, so it has none to show
 */
export const asRadioFateHeldBehindHalt = (input: {
  record: RadioTaskRecord;
  halter: Extract<RadioTaskRecordFate, { fate: 'held' }>;
}): RadioTaskRecordFate => ({
  fate: 'held',
  record: asRadioTaskRecordSettled({
    record: input.record,
    change: { reason: input.halter.record.reason },
  }),
  lift: null,
  detail: input.halter.detail,
  halt: false,
});
