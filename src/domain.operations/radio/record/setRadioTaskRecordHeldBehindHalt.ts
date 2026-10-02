import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioFateHeldBehindHalt } from './asRadioFateHeldBehindHalt';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = hold a record that sits in line behind a halt: persist the halter's reason, unsent
 * .why = the drain output names the halter's reason for each record behind it, so the store
 *        must hold that same reason — a later read never contradicts what the drain printed
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
  daoRadioTaskRecord.set.upsert({ dir: input.dir, record: fate.record });
  return fate;
};
