import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';

import { asRadioTaskRecordHeldSeqNext } from './asRadioTaskRecordHeldSeqNext';

/**
 * .what = the heldSeq a new record takes: 1 + the highest heldSeq in its dir
 * .why = the drain delivers in push order; heldAt has one-second precision, so two
 *        pushes in one second would tie, and the tiebreak would fall to the key hash
 */
export const getOneRadioTaskRecordHeldSeqNext = (input: {
  dir: string;
}): number =>
  asRadioTaskRecordHeldSeqNext({
    records: daoRadioTaskRecord.get.all({ dirs: [input.dir] }),
  });
