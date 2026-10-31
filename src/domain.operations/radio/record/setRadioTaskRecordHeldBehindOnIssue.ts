import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import { setRadioTaskRecordSettled } from './setRadioTaskRecordSettled';

/**
 * .what = hold a record unsent behind an earlier record on the same issue that still waits
 * .why = updates to one issue land in order; this one goes once the one ahead of it lands
 *
 * .note = the reason names the record ahead by key, so `queue get` shows why it waits; the
 *         write goes through setRadioTaskRecordSettled, so a re-push keeps its new body
 */
export const setRadioTaskRecordHeldBehindOnIssue = (input: {
  record: RadioTaskRecord;
  dir: string;
  ahead: Extract<RadioTaskRecordFate, { fate: 'held' }>;
}): RadioTaskRecordFate => {
  const reason = `behind:${input.ahead.record.key} (same issue #${input.record.exid})`;
  const record = setRadioTaskRecordSettled({
    dir: input.dir,
    record: input.record,
    change: { reason },
  });
  return {
    fate: 'held',
    record,
    lift: null,
    detail: `behind ${asRadioTaskRecordLabel({ record: input.ahead.record })} on the same issue: unsent, sends once it lands or is dropped`,
    halt: false,
  };
};
