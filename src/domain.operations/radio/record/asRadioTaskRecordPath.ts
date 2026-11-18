import { relative } from 'path';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';

/**
 * .what = the path of one record file, from the repo root
 * .why = a record held for its promise must be read before it is vouched; its fix lines and the
 *        nudge name the one file that holds the full text, in the path a human types from
 */
export const asRadioTaskRecordPath = (
  input: { dir: string; key: string },
  context: { cwd: string },
): string =>
  relative(
    context.cwd,
    daoRadioTaskRecord.get.path({ dir: input.dir, key: input.key }),
  );
