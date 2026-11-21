import { isRadioPromiseHoldReason } from '../promise/isRadioPromiseHoldReason';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = the held fates whose record awaits an anonymized promise
 * .why = a plain push never sends a record the promise gate held, so a line that says
 *        "the next push delivers the backlog" must count those apart and name `drain --promise`
 */
export const getAllRadioFatesAwaitPromise = (input: {
  fates: RadioTaskRecordFate[];
}): Extract<RadioTaskRecordFate, { fate: 'held' }>[] =>
  input.fates.filter(
    (fate): fate is Extract<RadioTaskRecordFate, { fate: 'held' }> =>
      fate.fate === 'held' && isRadioPromiseHoldReason(fate.record.reason),
  );
