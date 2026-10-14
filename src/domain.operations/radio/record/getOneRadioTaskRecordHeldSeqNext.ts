import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';

import { asRadioTaskRecordHeldSeqNext } from './asRadioTaskRecordHeldSeqNext';
import { getAllRadioTaskRecordDirs } from './getAllRadioTaskRecordDirs';

/**
 * .what = the heldSeq a new record takes: 1 + the highest heldSeq in any record dir of the worktree
 * .why = the drain sweeps every record dir and delivers in push order; a record holds no clock,
 *        so the sequence alone must order a push in one route against a push in another
 *
 * .note = it reads leniently: a malformed record elsewhere is skipped here, so the push is still
 *         recorded; the drain's strict read right after fails loud on that file
 * .note = push order holds within one worktree. two worktrees mint apart, so a merge of two
 *         branches' records orders a seq tie by key
 */
export const getOneRadioTaskRecordHeldSeqNext = (
  input: Record<string, never>,
  context: { cwd: string },
): number =>
  asRadioTaskRecordHeldSeqNext({
    records: daoRadioTaskRecord.get.allReadable({
      dirs: getAllRadioTaskRecordDirs({}, context),
    }),
  });
