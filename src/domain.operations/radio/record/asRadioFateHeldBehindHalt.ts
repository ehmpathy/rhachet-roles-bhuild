import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = the fate of a record in line behind an upstream fault: held, unsent
 * .why = a fault that halts the drain likely hits every record after it, so each
 *        stays held in its place, and reports the fault's reason, never a reorder
 */
export const asRadioFateHeldBehindHalt = (input: {
  record: RadioTaskRecord;
  halter: Extract<RadioTaskRecordFate, { fate: 'held' }>;
}): RadioTaskRecordFate => ({
  fate: 'held',
  record: new RadioTaskRecord({
    ...input.record,
    reason: input.halter.record.reason,
  }),
  lift: null,
  detail: input.halter.detail,
  halt: false,
});
