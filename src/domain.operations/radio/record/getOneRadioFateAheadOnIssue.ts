import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { isRadioTaskRecordAheadOnIssue } from './isRadioTaskRecordAheadOnIssue';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

type HeldFate = Extract<RadioTaskRecordFate, { fate: 'held' }>;

/**
 * .what = the earlier record in this drain, on the same issue, that still waits — or null
 * .why = updates to one issue must land in order: a DELIVERED sent past its set-aside CLAIMED
 *        is refused upstream ("cannot deliver unclaimed task") and closed for good. so a
 *        record on an issue whose earlier update still waits must wait behind it
 *
 * .note = which records hold back which is `isRadioTaskRecordAheadOnIssue` (a create waits on
 *         naught; naught waits behind a comment)
 * .note = a gate-held record ahead is skipped: the same repo meets the same gate, so the record
 *         behind is held at that gate too, and its gate reason must stay its reason
 */
export const getOneRadioFateAheadOnIssue = (input: {
  record: RadioTaskRecord;
  fates: RadioTaskRecordFate[];
}): HeldFate | null => {
  // the earliest held fate that holds this record back, not held at a gate
  const ahead = input.fates.find(
    (fate): fate is HeldFate =>
      fate.fate === 'held' &&
      fate.lift === null &&
      isRadioTaskRecordAheadOnIssue({
        ahead: fate.record,
        behind: input.record,
      }),
  );
  return ahead ?? null;
};
