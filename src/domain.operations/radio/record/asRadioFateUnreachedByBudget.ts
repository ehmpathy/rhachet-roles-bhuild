import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = the detail of a record the drain did not reach; a render keys on it to show the
 *         record as not attempted, never with the prior drain's fault
 */
export const DETAIL_UNREACHED_BY_BUDGET =
  'not attempted: this drain spent its send budget; run rhx radio.task.queue drain again';

/**
 * .what = the fate of a record the drain did not reach before its send budget was spent
 * .why = the record stays QUEUED and untouched on disk, in its place; the fate says why it
 *        waits and names the one move: drain again
 */
export const asRadioFateUnreachedByBudget = (input: {
  record: RadioTaskRecord;
}): RadioTaskRecordFate => ({
  fate: 'held',
  record: input.record,
  lift: null,
  detail: DETAIL_UNREACHED_BY_BUDGET,
  halt: false,
});
