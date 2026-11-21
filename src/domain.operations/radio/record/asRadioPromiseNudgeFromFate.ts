import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import type { RadioPromiseHoldReason } from '../promise/RadioPromiseHoldReason';
import { isRadioTaskRecordDroppedForPromise } from './isRadioTaskRecordDroppedForPromise';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = the promise nudge a push owes its caller, read from its own fate, or null
 * .why = only the drain that dropped the push's own record for its promise returns a held fate
 *        for it; a record a human dropped reads as refused, so it never nudges
 */
export const asRadioPromiseNudgeFromFate = (input: {
  pushed: RadioTaskRecordFate | { fate: 'landed'; record: RadioTaskRecord };
}): {
  reason: RadioPromiseHoldReason;
  record: RadioTaskRecord;
  dir: string;
} | null => {
  const { pushed } = input;
  if (pushed.fate !== 'held') return null;
  if (!isRadioTaskRecordDroppedForPromise(pushed.record)) return null;
  return {
    reason: pushed.record.reason,
    record: pushed.record,
    dir: pushed.dir,
  };
};
