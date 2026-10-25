import { ConstraintError } from 'helpful-errors';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { getOneRadioTaskRecordHeldByKey } from './getOneRadioTaskRecordHeldByKey';
import { withRadioDrainLock } from './withRadioDrainLock';

/**
 * .what = amend the auth or the body of one held record; its place in line, target, and
 *         identity stay as they were, and naught is sent
 * .why = a record set aside on an access fault can land under another auth (#603) without a
 *        drop and a re-push; the next drain sends it on its new terms
 *
 * .note = the title is the identity of a create (asRadioTaskRecordKey), so no amend may touch
 *         it; a retitle is a del + re-push (F5)
 * .note = runs under the drain lock, so an amend never lands mid-send: it waits for the drain,
 *         then acts on what the drain left (a record the drain delivered is refused as settled)
 */
const _setRadioTaskRecordAmended = async (
  input: { key: string; auth: string | null; description: string | null },
  context: { cwd: string },
): Promise<{
  before: RadioTaskRecord;
  after: RadioTaskRecord;
  dir: string;
}> => {
  // an amend must name at least one field
  if (input.auth === null && input.description === null)
    throw new ConstraintError(
      'naught to amend; pass --auth and/or --description',
    );

  // the record must be held
  const { record, dir } = getOneRadioTaskRecordHeldByKey(
    { key: input.key, verb: 'set' },
    context,
  );

  // write the amend whole; every other field, heldSeq included, is kept
  const after = daoRadioTaskRecord.set.upsert({
    dir,
    record: new RadioTaskRecord({
      ...record,
      auth: input.auth ?? record.auth,
      description: input.description ?? record.description,
    }),
  });
  return { before: record, after, dir };
};

export const setRadioTaskRecordAmended = withRadioDrainLock(
  _setRadioTaskRecordAmended,
);
