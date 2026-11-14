import { ConstraintError } from 'helpful-errors';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import type { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import type { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { asRadioTaskRecordFateKept } from './asRadioTaskRecordFateKept';
import { asRadioTaskRecordKeyOfComment } from './asRadioTaskRecordKeyOfComment';
import { getOneRadioTaskRecordByKey } from './getOneRadioTaskRecordByKey';
import { getOneRadioTaskRecordHeldSeqNext } from './getOneRadioTaskRecordHeldSeqNext';

/**
 * .what = transcribe a comment into its record, before any gate or send
 * .why = the local write is the transaction: once transcribed, a comment is never lost, and it
 *        rides the same gate, queue, and drain as a push
 *
 * .note = upsert on the comment identity (repo, exid, sha of the body). a repeat lands on its
 *         extant record and keeps its place in line; its auth wins when named, else the extant
 *         auth stays, so a bare retry never undoes a `queue set --auth` amend
 * .note = the body rides the record's `description` field; it is part of the key, so it never
 *         changes on a record
 */
export const setRadioTaskRecordFromComment = (
  input: {
    comment: {
      repo: RadioTaskRepo;
      via: RadioChannel;
      auth: string | null;
      exid: string;
      body: string;
    };
  },
  context: { dir: string; cwd: string },
): {
  record: RadioTaskRecord;
  before: RadioTaskRecord | null;
  dir: string;
} => {
  // lookup the extant record for this comment, in whichever dir holds it
  const key = asRadioTaskRecordKeyOfComment(input.comment);
  const extant = getOneRadioTaskRecordByKey(
    { key, dirHome: context.dir },
    { cwd: context.cwd },
  );
  const before = extant?.record ?? null;

  // refuse a repeat over another channel: a record keeps one channel
  if (before && before.via !== input.comment.via)
    throw new ConstraintError(
      `this comment matches record ${key}, which goes via ${before.via}, not via ${input.comment.via}; a record keeps one channel. to send over ${input.comment.via}, drop the record first: rhx radio.task.queue del --uuid ${key} --why "resend via ${input.comment.via}"`,
      { key, viaExtant: before.via, viaComment: input.comment.via },
    );

  // a repeat lands where its record lives, and keeps its place in line
  const dir = extant?.dir ?? context.dir;
  const heldSeq =
    before?.heldSeq ??
    getOneRadioTaskRecordHeldSeqNext({}, { cwd: context.cwd });

  // the fate: kept unless this comment re-queues the record (a refused or dropped one)
  const fate = asRadioTaskRecordFateKept({
    before,
    push: { description: input.comment.body },
  });

  // compose and write it whole
  const record = new RadioTaskRecord({
    key,
    kind: 'comment',
    repo: input.comment.repo,
    via: input.comment.via,
    auth: input.comment.auth ?? before?.auth ?? null,
    idem: null,
    title: null,
    // a kept record keeps the body it was recorded with, so a repeat never rewrites the file
    description: fate?.description ?? input.comment.body,
    exid: input.comment.exid,
    status: null,
    recordStatus: fate?.recordStatus ?? RadioTaskRecordStatus.QUEUED,
    reason: fate?.reason ?? null,
    heldSeq,
    deliveredExid: fate?.deliveredExid ?? null,
  });
  daoRadioTaskRecord.set.upsert({ dir, record });
  return { record, before, dir };
};
