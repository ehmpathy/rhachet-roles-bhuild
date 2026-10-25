import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { getAllRadioTaskRecordDirs } from './getAllRadioTaskRecordDirs';

/**
 * .what = the record of one key, from whichever record dir of the worktree holds it
 * .why = `queue set` and `queue del` name a record by the key `queue get` prints; the
 *        caller need not know which route held it
 */
export const getOneRadioTaskRecordInWorktree = (
  input: { key: string },
  context: { cwd: string },
): { record: RadioTaskRecord; dir: string } | null => {
  const [found] = getAllRadioTaskRecordDirs({}, context).flatMap((dir) => {
    const record = daoRadioTaskRecord.get.one.byUnique({ dir, key: input.key });
    return record ? [{ record, dir }] : [];
  });
  return found ?? null;
};
