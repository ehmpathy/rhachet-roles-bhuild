import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioTaskRecordOrder } from './asRadioTaskRecordOrder';
import { getAllRadioTaskRecordsHeld } from './getAllRadioTaskRecordsHeld';
import { isRadioTaskRecordAheadOnIssue } from './isRadioTaskRecordAheadOnIssue';

/**
 * .what = every held record later in line that waited behind this one on its issue, oldest first
 * .why = updates to one issue land in order, so a drop of one tells the human which waited
 *        behind it and now send on the next drain; a record ahead of it never waited on it
 *
 * .note = which records wait behind which is `isRadioTaskRecordAheadOnIssue`, the same predicate
 *         the drain orders by, so a dropped comment or create reports no phantom waiters
 */
export const getAllRadioTaskRecordsHeldOnIssue = (
  input: { record: RadioTaskRecord },
  context: { cwd: string },
): RadioTaskRecord[] =>
  getAllRadioTaskRecordsHeld({}, context)
    .map(({ record }) => record)
    .filter(
      (record) =>
        record.key !== input.record.key &&
        isRadioTaskRecordAheadOnIssue({
          ahead: input.record,
          behind: record,
        }) &&
        asRadioTaskRecordOrder({
          a: { record },
          b: { record: input.record },
        }) > 0,
    );
