import { ConstraintError } from 'helpful-errors';
import { join, relative } from 'path';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';

import { getOneRadioTaskRecordHeldByKey } from './getOneRadioTaskRecordHeldByKey';
import { withRadioDrainLock } from './withRadioDrainLock';

/**
 * .what = drop one held record: it leaves the queue, never sent, its body and the why kept
 * .why = a record no auth will land (a moot task, a superseded edit) must not wait forever,
 *        and its words must not vanish with it — the file stays where it was, DROPPED (F4)
 *
 * .note = a re-push of the same identity re-queues it (isRadioTaskRecordRequeuedByPush)
 * .note = runs under the drain lock, so a drop never lands between a send and its settle
 */
const _setRadioTaskRecordDropped = async (
  input: { key: string; why: string },
  context: { cwd: string },
): Promise<{ record: RadioTaskRecord; path: string }> => {
  // a drop must say why; the why is the record of the choice
  if (!input.why.trim())
    throw new ConstraintError(
      '--why is required; say why this record is dropped, e.g. --why "superseded by #604"',
    );

  // the record must be held
  const { record, dir } = getOneRadioTaskRecordHeldByKey(
    { key: input.key, verb: 'del' },
    context,
  );

  // mark it dropped in place; the body stays as it was
  const dropped = daoRadioTaskRecord.set.upsert({
    dir,
    record: new RadioTaskRecord({
      ...record,
      recordStatus: RadioTaskRecordStatus.DROPPED,
      reason: `dropped: ${input.why.trim()}`,
    }),
  });

  // name where its words are kept, from the repo root, as the push names `held at`
  return {
    record: dropped,
    path: relative(context.cwd, join(dir, `record.${record.key}.json`)),
  };
};

export const setRadioTaskRecordDropped = withRadioDrainLock(
  _setRadioTaskRecordDropped,
);
