import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { getOneRadioUsagePermissionDecision } from '@src/domain.operations/radio/permission/getOneRadioUsagePermissionDecision';

import { asRadioOtherFates } from './asRadioOtherFates';
import { asRadioPushedFate } from './asRadioPushedFate';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import { getOneRadioPushRecordAfterDrain } from './getOneRadioPushRecordAfterDrain';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import type { ShellExecutor } from './ShellExecutor';
import { setRadioTaskRecordHeldAtGate } from './setRadioTaskRecordHeldAtGate';
import { setRadioTaskRecordsDrained } from './setRadioTaskRecordsDrained';

/**
 * .what = dispatch a transcribed push; through an open gate, drain EVERY held record
 *         in this worktree (every route, every target), oldest first
 * .why = the push is a probe of its target's gate. shut: this record is held and naught
 *        is sent. open: the whole worktree backlog goes out, this push in its turn (F4)
 *
 * .note = one push may send many upstream writes; the name says so, since the
 *         backlog it carries is the point of the call, not a side effect
 *
 * .note = a record that already landed meets a shut gate as 'landed': naught to send,
 *         naught to hold (C9)
 */
export const setRadioTaskRecordsDrainedByPush = async (
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
}> => {
  // check the gate for this push's own target
  const gate = await getOneRadioUsagePermissionDecision(
    {
      targetRepo: asRadioTaskRepoSlug({ repo: input.record.repo }),
      sourceCwd: context.cwd,
    },
    { homeDir: context.homeDir },
  );

  // gate shut, record already landed: naught to send, naught to hold
  const isLanded =
    input.record.recordStatus === RadioTaskRecordStatus.DELIVERED;
  if (!gate.allowed && isLanded)
    return { pushed: { fate: 'landed', record: input.record }, others: [] };

  // gate shut: hold this push, with the reason and who lifts it
  if (!gate.allowed)
    return {
      pushed: setRadioTaskRecordHeldAtGate({ ...input, gate }),
      others: [],
    };

  // gate open: drain the backlog; a landed push is not in it, and stays landed (C3, C6)
  // only the auth a human typed on this push is live; a bare re-push inherits the stored
  // auth onto its record, so the record's auth is never proof the human typed it
  const drained = await setRadioTaskRecordsDrained(
    {},
    {
      ...context,
      authLive:
        input.authTyped === null
          ? null
          : { key: input.record.key, auth: input.authTyped },
    },
  );

  // a concurrent drain may have carried this push ahead of its own drain (C19, X2);
  // its record on disk then reads as landed, and naught is re-sent
  const { fates } = drained;
  const record = getOneRadioPushRecordAfterDrain({
    fates,
    record: input.record,
    dir: input.dir,
  });
  return {
    pushed: asRadioPushedFate({ fates, record }),
    others: asRadioOtherFates({ fates, record }),
  };
};
