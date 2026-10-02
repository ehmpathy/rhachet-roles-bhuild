import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioTaskRecordOrder } from './asRadioTaskRecordOrder';
import { getAllRadioTaskRecordDirs } from './getAllRadioTaskRecordDirs';
import { isRadioTaskRecordHeld } from './isRadioTaskRecordHeld';

/**
 * .what = every held (QUEUED) record in this worktree, oldest first
 * .why = the drain delivers in the order the pushes were made; the stop reminder counts them
 */
export const getAllRadioTaskRecordsHeld = (
  input: Record<string, never>,
  context: { cwd: string },
): { record: RadioTaskRecord; dir: string }[] =>
  daoRadioTaskRecord.get
    .all({ dirs: getAllRadioTaskRecordDirs({}, context) })
    .filter(isRadioTaskRecordHeld)
    .sort((a, b) => asRadioTaskRecordOrder({ a, b }));
