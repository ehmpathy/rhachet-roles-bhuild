import { ConstraintError } from 'helpful-errors';
import { relative } from 'path';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { getOneRadioTaskRecordHeldByKey } from './getOneRadioTaskRecordHeldByKey';
import { isRadioRecordAuthReplayable } from './isRadioRecordAuthReplayable';
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
  path: string;
}> => {
  // an amend must name at least one field
  if (input.auth === null && input.description === null)
    throw new ConstraintError(
      'naught to amend; pass --auth and/or --description',
    );

  // a body may be replaced, never blanked: an empty arg or an empty @stdin is a slip, and a
  // create sent with no body reaches upstream as an empty task
  if (input.description !== null && input.description.trim() === '')
    throw new ConstraintError(
      '--description is empty; a held record keeps a body. pass the new body (or pipe it via --description @stdin), or omit --description to keep the current one',
      { key: input.key },
    );

  // a stored auth may name a mode, never a command: a drain refuses to replay it, so the
  // amend would promise a send that never comes
  if (!isRadioRecordAuthReplayable({ auth: input.auth }))
    throw new ConstraintError(
      `--auth ${input.auth} cannot be stored on a record; a drain never replays a stored auth that runs a shell or names an unsafe owner or var. pass it to the drain instead: rhx radio.task.queue drain --auth '${input.auth}'`,
    );

  // the record must be held
  const { record, dir } = getOneRadioTaskRecordHeldByKey(
    { key: input.key, verb: 'set' },
    context,
  );

  // write the amend whole; heldSeq and identity are kept. a new auth clears the last fault: it
  // was the verdict on the old auth, so `queue get` must not repeat its advice. a body-only
  // amend cures no auth fault, so the fault and its fix stay on record
  const after = daoRadioTaskRecord.set.upsert({
    dir,
    record: new RadioTaskRecord({
      ...record,
      auth: input.auth ?? record.auth,
      description: input.description ?? record.description,
      reason: input.auth === null ? record.reason : null,
    }),
  });

  // name where the amended record is kept, from the repo root, as `del` names `kept at`
  return {
    before: record,
    after,
    dir,
    path: relative(
      context.cwd,
      daoRadioTaskRecord.get.path({ dir, key: record.key }),
    ),
  };
};

export const setRadioTaskRecordAmended = withRadioDrainLock(
  _setRadioTaskRecordAmended,
);
