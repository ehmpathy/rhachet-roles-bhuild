import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = the drain's fates for every record other than this push's own
 * .why = the push reports its own fate apart; the rest render as the backlog it carried
 */
export const asRadioOtherFates = (input: {
  fates: RadioTaskRecordFate[];
  record: RadioTaskRecord;
}): RadioTaskRecordFate[] =>
  input.fates.filter((fate) => fate.record.key !== input.record.key);
