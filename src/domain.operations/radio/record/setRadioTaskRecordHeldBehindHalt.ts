import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioFateHeldBehindHalt } from './asRadioFateHeldBehindHalt';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import { setRadioTaskRecordSettled } from './setRadioTaskRecordSettled';

/**
 * .what = hold a record that sits in line behind a halt: persist the halter's reason, unsent
 * .why = the drain output names the halter's reason for each record behind it, so the store
 *        must hold that same reason — a later read never contradicts what the drain printed
 *
 * .note = the write goes through setRadioTaskRecordSettled, so a re-push that landed while an
 *         earlier record was sent keeps its new body
 */
export const setRadioTaskRecordHeldBehindHalt = (input: {
  record: RadioTaskRecord;
  dir: string;
  halter: Extract<RadioTaskRecordFate, { fate: 'held' }>;
}): RadioTaskRecordFate => {
  const fate = asRadioFateHeldBehindHalt({
    record: input.record,
    halter: input.halter,
  });
  const record = setRadioTaskRecordSettled({
    dir: input.dir,
    record: input.record,
    change: { reason: fate.record.reason },
  });
  return { ...fate, record };
};
