import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';

/**
 * .what = every record dir in this worktree
 * .why = the drain and the stop reminder reach every held task, whichever
 *        route (or none) held it
 */
export const getAllRadioTaskRecordDirs = (
  input: Record<string, never>,
  context: { cwd: string },
): string[] => daoRadioTaskRecord.get.dirs({ cwd: context.cwd });
