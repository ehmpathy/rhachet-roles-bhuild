import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';

import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import type { ShellExecutor } from './ShellExecutor';
import { setRadioTaskRecordUpstream } from './setRadioTaskRecordUpstream';

/**
 * .what = the drain's fates, with this push's own fate settled when a concurrent drain carried it
 * .why = drains run one at a time per worktree; a push held when it began may find its record
 *        delivered by the drain ahead of it, so its own drain never saw it held. a re-send via the
 *        extant upstream findsert finds the task the first drain wrote (now sequential, so X2 holds)
 *        and yields this push's delivered fate, never a double
 *
 * .note = a push already DELIVERED when it began is a re-push of a landed task (C3, C6); it is
 *         left out here, so it still reads as landed and is never re-sent
 */
export const setRadioPushSettledAfterDrain = async (
  input: { fates: RadioTaskRecordFate[]; record: RadioTaskRecord; dir: string },
  context: {
    cwd: string;
    homeDir: string | undefined;
    env: NodeJS.ProcessEnv;
    shx: ShellExecutor;
  },
): Promise<RadioTaskRecordFate[]> => {
  // the drain carried this push, or the push began landed: naught to settle
  const isCarried = input.fates.some(
    (fate) => fate.record.key === input.record.key,
  );
  const isLandedAtStart =
    input.record.recordStatus === RadioTaskRecordStatus.DELIVERED;
  if (isCarried || isLandedAtStart) return input.fates;

  // not delivered by a concurrent drain either: leave it for the fail-loud check downstream
  const recordNow = daoRadioTaskRecord.get.one.byUnique({
    dir: input.dir,
    key: input.record.key,
  });
  if (recordNow?.recordStatus !== RadioTaskRecordStatus.DELIVERED)
    return input.fates;

  // a concurrent drain delivered it: confirm upstream, which finds the task it wrote
  const fate = await setRadioTaskRecordUpstream(
    { record: recordNow, dir: input.dir },
    context,
  );
  return [...input.fates, fate];
};
