import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = the detail of a record a re-push rewrote mid-send; a render keys on it to show the
 *         record as not attempted, never with the prior drain's fault
 */
export const DETAIL_REPUSHED_MID_SEND =
  'a re-push rewrote this record while its prior copy was sent; the next drain sends the new request';

/**
 * .what = the fate of a record that a re-push rewrote while the drain sent its prior copy
 * .why = the settle left the re-push's request QUEUED on disk, so the fate must say held,
 *        never delivered or refused; the re-push's own drain sends the new request
 */
export const asRadioFateRepushedMidSend = (input: {
  record: RadioTaskRecord;
}): Extract<RadioTaskRecordFate, { fate: 'held' }> => ({
  fate: 'held',
  record: input.record,
  lift: null,
  detail: DETAIL_REPUSHED_MID_SEND,
  halt: false,
});
