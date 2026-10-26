import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioTaskRecordOrder } from './asRadioTaskRecordOrder';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import { getAllRadioTaskRecordsHeld } from './getAllRadioTaskRecordsHeld';

/**
 * .what = every held record later in line that updates the same issue as this one, oldest first
 * .why = updates to one issue land in order, so a drop of one tells the human which waited
 *        behind it and now send on the next drain; a record ahead of it never waited on it
 *
 * .note = a create (no exid) names no issue yet, so none wait on it
 */
export const getAllRadioTaskRecordsHeldOnIssue = (
  input: { record: RadioTaskRecord },
  context: { cwd: string },
): RadioTaskRecord[] => {
  // a create names no issue
  const exid = input.record.exid;
  if (exid === null) return [];

  // the held records on the same (repo, exid), later in line than this one
  const slug = asRadioTaskRepoSlug({ repo: input.record.repo });
  return getAllRadioTaskRecordsHeld({}, context)
    .map(({ record }) => record)
    .filter(
      (record) =>
        record.key !== input.record.key &&
        record.exid === exid &&
        record.via === input.record.via &&
        asRadioTaskRepoSlug({ repo: record.repo }) === slug &&
        asRadioTaskRecordOrder({
          a: { record },
          b: { record: input.record },
        }) > 0,
    );
};
