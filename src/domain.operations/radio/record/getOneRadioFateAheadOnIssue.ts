import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

type HeldFate = Extract<RadioTaskRecordFate, { fate: 'held' }>;

/**
 * .what = the earlier record in this drain, on the same issue, that still waits — or null
 * .why = updates to one issue must land in order: a DELIVERED sent past its set-aside CLAIMED
 *        is refused upstream ("cannot deliver unclaimed task") and closed for good. so a
 *        record on an issue whose earlier update still waits must wait behind it
 *
 * .note = a create (no exid) names no issue yet, so it never waits on another record
 * .note = a gate-held record ahead is skipped: the same repo meets the same gate, so the record
 *         behind is held at that gate too, and its gate reason must stay its reason
 */
export const getOneRadioFateAheadOnIssue = (input: {
  record: RadioTaskRecord;
  fates: RadioTaskRecordFate[];
}): HeldFate | null => {
  // a create names no issue
  const exid = input.record.exid;
  if (exid === null) return null;

  // the earliest held fate on the same (repo, exid), not held at a gate
  const slug = asRadioTaskRepoSlug({ repo: input.record.repo });
  const ahead = input.fates.find(
    (fate): fate is HeldFate =>
      fate.fate === 'held' &&
      fate.lift === null &&
      fate.record.exid === exid &&
      fate.record.via === input.record.via &&
      asRadioTaskRepoSlug({ repo: fate.record.repo }) === slug,
  );
  return ahead ?? null;
};
