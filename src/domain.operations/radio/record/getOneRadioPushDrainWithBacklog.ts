import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import type { RadioPromiseHoldReason } from '../promise/RadioPromiseHoldReason';
import { asRadioPromiseNudgeFromFate } from './asRadioPromiseNudgeFromFate';
import { asRadioTaskRecordPath } from './asRadioTaskRecordPath';
import { getAllRadioTaskRecordsHeld } from './getAllRadioTaskRecordsHeld';
import { getAllRadioTaskRecordsHeldOnIssue } from './getAllRadioTaskRecordsHeldOnIssue';
import { getOneRadioDeliverBehindDroppedClaim } from './getOneRadioDeliverBehindDroppedClaim';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import type { ShellExecutor } from './ShellExecutor';
import { setRadioTaskRecordsDrainedByPush } from './setRadioTaskRecordsDrainedByPush';

/**
 * .what = drain the backlog a push carries, then read what still waits
 * .why = a push reports its own fate, the fates of the records it carried, and the backlog
 *        left behind, as one result
 *
 * .note = nudge is set when the promise gate dropped this push's own record: it names the
 *         reason, the record and its path, the held updates on its issue that wait behind it,
 *         and whether a deliver behind it now lacks its claim, so no strand goes unseen
 * .note = the backlog is read after the drain, so a dropped record is never counted in it
 * .note = backlog and behind are a report, read after the drain lock frees: a push or drain in
 *         another shell may land in the gap, so the counts are the state as of the read, never a
 *         guarantee. no send or settle decision reads them; each drain re-reads disk under its lock
 */
export const getOneRadioPushDrainWithBacklog = async (
  input: { record: RadioTaskRecord; dir: string; authTyped: string | null },
  context: {
    cwd: string;
    homeDir: string | undefined;
    env: NodeJS.ProcessEnv;
    shx: ShellExecutor;
  },
): Promise<{
  pushed: RadioTaskRecordFate | { fate: 'landed'; record: RadioTaskRecord };
  others: RadioTaskRecordFate[];
  backlog: { record: RadioTaskRecord; dir: string }[];
  nudge: {
    reason: RadioPromiseHoldReason;
    record: RadioTaskRecord;
    recordPath: string;
    behind: RadioTaskRecord[];
    deliverNeedsClaim: boolean;
  } | null;
}> => {
  // drain the line this push rides
  const drained = await setRadioTaskRecordsDrainedByPush(input, context);

  // read what still waits
  const backlog = getAllRadioTaskRecordsHeld({}, context);

  // the promise nudge, with the strand check `queue del` makes for a drop
  const nudgeOfFate = asRadioPromiseNudgeFromFate({ pushed: drained.pushed });
  if (!nudgeOfFate) return { ...drained, backlog, nudge: null };
  const behind = getAllRadioTaskRecordsHeldOnIssue(
    { record: nudgeOfFate.record },
    context,
  );
  const deliverBehind = getOneRadioDeliverBehindDroppedClaim({
    dropped: nudgeOfFate.record,
    behind,
  });
  return {
    ...drained,
    backlog,
    nudge: {
      reason: nudgeOfFate.reason,
      record: nudgeOfFate.record,
      recordPath: asRadioTaskRecordPath(
        { dir: nudgeOfFate.dir, key: nudgeOfFate.record.key },
        context,
      ),
      behind,
      deliverNeedsClaim: deliverBehind !== null,
    },
  };
};
