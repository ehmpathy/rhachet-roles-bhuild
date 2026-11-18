import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { isRadioTaskWithText } from '../promise/isRadioTaskWithText';

/**
 * .what = must an update later in line on the same issue wait behind this held one
 * .why = updates to one issue land in order only where order changes the outcome: a status step
 *        has dependents (a DELIVERED needs its CLAIMED first), and two text writes must land
 *        last-write-wins. a text-only edit ahead holds no order over a status-only step behind,
 *        so a held text edit (e.g. one that awaits a promise) never strands a status change
 *
 * .note = read from the request alone, never from `reason`: a reason is rewritten by a drop,
 *         a fault, or a wait, so a predicate on it would answer two ways for one pair
 */
export const isRadioTaskRecordAheadBlocksBehind = (input: {
  ahead: Pick<RadioTaskRecord, 'status' | 'title' | 'description'>;
  behind: Pick<RadioTaskRecord, 'title' | 'description'>;
}): boolean => {
  // a status step ahead orders every later step on its issue
  if (input.ahead.status !== null) return true;

  // two text writes keep their order, so the last one wins
  return isRadioTaskWithText(input.ahead) && isRadioTaskWithText(input.behind);
};
