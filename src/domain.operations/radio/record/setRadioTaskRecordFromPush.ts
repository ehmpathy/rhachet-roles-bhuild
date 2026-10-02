import { now } from 'iso-time';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import type { IdempotencyMode } from '@src/domain.objects/IdempotencyMode';
import type { RadioChannel } from '@src/domain.objects/RadioChannel';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import type { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import type { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { asRadioTaskRecordFromPush } from './asRadioTaskRecordFromPush';
import { asRadioTaskRecordKey } from './asRadioTaskRecordKey';
import { getOneRadioTaskRecordHeldSeqNext } from './getOneRadioTaskRecordHeldSeqNext';

/**
 * .what = transcribe a push attempt into its record, before any gate or send
 * .why = the local write is the transaction: once transcribed, a push is never lost
 *
 * .note = upsert on the push identity. a repeat push lands on its extant record and
 *         keeps its place in line; what it keeps and resets is asRadioTaskRecordFromPush
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
  context: { dir: string },
): { record: RadioTaskRecord; before: RadioTaskRecord | null } => {
  // lookup the extant record for this push identity
  const key = asRadioTaskRecordKey(input.push);
  const before = daoRadioTaskRecord.get.one.byUnique({ dir: context.dir, key });

  // compose the record this push transcribes into
  const record = asRadioTaskRecordFromPush({
    key,
    push: input.push,
    before,
    next: {
      heldAt: now(),
      heldSeq: getOneRadioTaskRecordHeldSeqNext({ dir: context.dir }),
    },
  });

  // write it whole
  daoRadioTaskRecord.set.upsert({ dir: context.dir, record });
  return { record, before };
};
