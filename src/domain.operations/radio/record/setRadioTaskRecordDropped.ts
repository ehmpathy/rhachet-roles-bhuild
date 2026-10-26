import { ConstraintError } from 'helpful-errors';
import { relative } from 'path';

import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';

import { getAllRadioTaskRecordsHeldOnIssue } from './getAllRadioTaskRecordsHeldOnIssue';
import { getOneRadioDeliverBehindDroppedClaim } from './getOneRadioDeliverBehindDroppedClaim';
import { getOneRadioTaskRecordByKey } from './getOneRadioTaskRecordByKey';
import { getOneRadioTaskRecordHeldByKey } from './getOneRadioTaskRecordHeldByKey';
import { withRadioDrainLock } from './withRadioDrainLock';

/**
 * .what = drop one held record: it leaves the queue, never sent, its body and the why kept
 * .why = a record no auth will land (a moot task, a superseded edit) must not wait forever,
 *        and its words must not vanish with it — the file stays where it was, DROPPED (F4)
 *
 * .note = a re-push of the same identity re-queues it (isRadioTaskRecordRequeuedByPush)
 * .note = idempotent: a second drop of a DROPPED record writes naught and keeps the first why
 * .note = runs under the drain lock, so a drop never lands between a send and its settle
 */
const _setRadioTaskRecordDropped = async (
  input: { key: string; why: string },
  context: { cwd: string },
): Promise<{
  record: RadioTaskRecord;
  path: string;
  behind: number;
  deliverNeedsClaim: RadioTaskRecord | null;
  isAlreadyDropped: boolean;
}> => {
  // a drop must say why; the why is the record of the choice
  if (!input.why.trim())
    throw new ConstraintError(
      '--why is required; say why this record is dropped, e.g. --why "superseded by #604"',
    );

  // already dropped: the drop converged, so a retry skips the write and keeps the first why
  const foundAny = getOneRadioTaskRecordByKey(
    { key: input.key, dirHome: null },
    context,
  );
  const isAlreadyDropped =
    foundAny?.record.recordStatus === RadioTaskRecordStatus.DROPPED;
  const { dropped, dir } = isAlreadyDropped
    ? { dropped: foundAny.record, dir: foundAny.dir }
    : setRadioTaskRecordDroppedInPlace(input, context);

  // count the later updates to the same issue that wait behind it; they send next drain
  const behindAll = getAllRadioTaskRecordsHeldOnIssue(
    { record: dropped },
    context,
  );

  // a deliver behind a dropped claim lands only if the issue is already claimed upstream
  const deliverNeedsClaim = getOneRadioDeliverBehindDroppedClaim({
    dropped,
    behind: behindAll,
  });

  // name where its words are kept, from the repo root, as the push names `held at`
  return {
    record: dropped,
    path: relative(
      context.cwd,
      daoRadioTaskRecord.get.path({ dir, key: dropped.key }),
    ),
    behind: behindAll.length,
    deliverNeedsClaim,
    isAlreadyDropped,
  };
};

/**
 * .what = mark one held record DROPPED in place, its body as it was
 * .why = the one write a drop makes; a retry of a converged drop skips it
 */
const setRadioTaskRecordDroppedInPlace = (
  input: { key: string; why: string },
  context: { cwd: string },
): { dropped: RadioTaskRecord; dir: string } => {
  // the record must be held
  const { record, dir } = getOneRadioTaskRecordHeldByKey(
    { key: input.key, verb: 'del' },
    context,
  );

  // mark it dropped in place
  const dropped = daoRadioTaskRecord.set.upsert({
    dir,
    record: new RadioTaskRecord({
      ...record,
      recordStatus: RadioTaskRecordStatus.DROPPED,
      reason: `dropped: ${input.why.trim()}`,
    }),
  });
  return { dropped, dir };
};

export const setRadioTaskRecordDropped = withRadioDrainLock(
  _setRadioTaskRecordDropped,
);
