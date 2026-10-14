import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import type { IdempotencyMode } from '@src/domain.objects/IdempotencyMode';
import type { RadioChannel } from '@src/domain.objects/RadioChannel';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import type { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import type { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { asRadioTaskRecordFromPush } from './asRadioTaskRecordFromPush';
import { asRadioTaskRecordKey } from './asRadioTaskRecordKey';
import { getOneRadioTaskRecordByKey } from './getOneRadioTaskRecordByKey';
import { getOneRadioTaskRecordHeldSeqNext } from './getOneRadioTaskRecordHeldSeqNext';

/**
 * .what = transcribe a push attempt into its record, before any gate or send
 * .why = the local write is the transaction: once transcribed, a push is never lost
 *
 * .note = upsert on the push identity. a repeat push lands on its extant record and
 *         keeps its place in line (owned here); what else it keeps and resets is asRadioTaskRecordFromPush
 */
export const setRadioTaskRecordFromPush = (
  input: {
    push: {
      repo: RadioTaskRepo;
      via: RadioChannel;
      auth: string | null;
      idem: IdempotencyMode | null;
      title: string | null;
      description: string | null;
      exid: string | null;
      status: RadioTaskStatus | null;
    };
  },
  context: { dir: string; cwd: string },
): {
  record: RadioTaskRecord;
  before: RadioTaskRecord | null;
  dir: string;
} => {
  // lookup the extant record for this push identity, in whichever dir holds it
  const key = asRadioTaskRecordKey(input.push);
  const extant = getOneRadioTaskRecordByKey(
    { key, dirHome: context.dir },
    { cwd: context.cwd },
  );
  const before = extant?.record ?? null;

  // a repeat push lands where its record lives, even after a bind moved the home
  const dir = extant?.dir ?? context.dir;

  // the place in line: a repeat push keeps its seq; only a first push mints one
  const heldSeq =
    before?.heldSeq ??
    getOneRadioTaskRecordHeldSeqNext({}, { cwd: context.cwd });

  // compose the record this push transcribes into
  const record = asRadioTaskRecordFromPush({
    key,
    push: input.push,
    before,
    heldSeq,
  });

  // write it whole
  daoRadioTaskRecord.set.upsert({ dir, record });
  return { record, before, dir };
};
