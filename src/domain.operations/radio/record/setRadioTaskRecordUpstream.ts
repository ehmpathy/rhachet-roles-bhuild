import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { getOneRadioUsagePermissionDecision } from '@src/domain.operations/radio/permission/getOneRadioUsagePermissionDecision';

import { asRadioErrorDetail } from './asRadioErrorDetail';
import { asRadioErrorHeadline } from './asRadioErrorHeadline';
import { asRadioErrorHint } from './asRadioErrorHint';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import { asRadioUpstreamReason } from './asRadioUpstreamReason';
import { getOneRadioContextForRecord } from './getOneRadioContextForRecord';
import { isRadioReplayRefusal } from './isRadioReplayRefusal';
import { isRadioTaskRecordRepushedSince } from './isRadioTaskRecordRepushedSince';
import { isRadioUpstreamReasonHalt } from './isRadioUpstreamReasonHalt';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import type { ShellExecutor } from './ShellExecutor';
import { setRadioTaskRecordHeldAtGate } from './setRadioTaskRecordHeldAtGate';
import { setRadioTaskUpstreamFromRecord } from './setRadioTaskUpstreamFromRecord';

/**
 * .what = persist a record's new fate, unless a re-push rewrote its request since the send
 * .why = a shared write for held, refused, and delivered outcomes. the push transcribe runs
 *        outside the drain lock, so a re-push can land while this record is in flight; to
 *        settle the stale copy would write the old body back and mark it delivered, and the
 *        new body would never be sent. so the record is left as the re-push wrote it, QUEUED,
 *        and the re-push's own drain (next behind this lock) sends it
 *
 * .note = the read and the write here are adjacent, so the window left is microseconds,
 *         not the length of a send
 */
const setRecord = (input: {
  dir: string;
  record: RadioTaskRecord;
  change: Partial<RadioTaskRecord>;
}): RadioTaskRecord => {
  // a re-push since the send: leave its request queued, for its own drain
  const current = daoRadioTaskRecord.get.one.byUnique({
    dir: input.dir,
    key: input.record.key,
  });
  if (
    current &&
    isRadioTaskRecordRepushedSince({ read: input.record, current })
  )
    return current;

  // settle the record the send carried
  return daoRadioTaskRecord.set.upsert({
    dir: input.dir,
    record: new RadioTaskRecord({ ...input.record, ...input.change }),
  });
};

/**
 * .what = send one record upstream on its own terms, then settle its fate
 * .why = each record meets its own target's gate (X1) and its own channel + auth (C22);
 *        delivery reuses the extant upstream findsert, so a re-send never doubles (X2)
 *
 * .note = context.authOverride (a `drain --auth`) sends this record under that auth for
 *         this drain only; the record on disk keeps its own auth (F3)
 */
export const setRadioTaskRecordUpstream = async (
  input: { record: RadioTaskRecord; dir: string },
  context: {
    cwd: string;
    homeDir: string | undefined;
    env: NodeJS.ProcessEnv;
    shx: ShellExecutor;
    authOverride?: string | null;
  },
): Promise<RadioTaskRecordFate> => {
  const { record, dir } = input;

  // hold if this record's own target gate is shut
  const gate = await getOneRadioUsagePermissionDecision(
    {
      targetRepo: asRadioTaskRepoSlug({ repo: record.repo }),
      sourceCwd: context.cwd,
    },
    { homeDir: context.homeDir },
  );
  if (!gate.allowed) return setRadioTaskRecordHeldAtGate({ record, dir, gate });

  // derive this record's own credentials; hold if they cannot be derived now
  const auth = await getOneRadioContextForRecord(
    { record, authOverride: context.authOverride ?? null },
    context,
  );
  if ('fault' in auth)
    return {
      fate: 'held',
      record: setRecord({ dir, record, change: { reason: 'upstream:auth' } }),
      lift: null,
      detail: asRadioErrorDetail({
        message: auth.fault.message,
        hint: asRadioErrorHint({ error: auth.fault }),
      }),
      halt: false,
    };

  // send it; a refusal closes the record for good
  const send = await setRadioTaskUpstreamFromRecord(
    { record },
    auth.radioContext,
  );
  if ('fault' in send && isRadioReplayRefusal({ error: send.fault }))
    return {
      fate: 'refused',
      record: setRecord({
        dir,
        record,
        change: {
          recordStatus: RadioTaskRecordStatus.REFUSED,
          reason: asRadioErrorHeadline({ message: send.fault.message }),
        },
      }),
      detail: asRadioErrorHeadline({ message: send.fault.message }),
    };

  // a fault holds it: a wall halts the drain; any other sets this one aside (#511)
  if ('fault' in send) {
    const reason = asRadioUpstreamReason({ message: send.fault.message });
    return {
      fate: 'held',
      record: setRecord({ dir, record, change: { reason } }),
      lift: null,
      detail: asRadioErrorDetail({
        message: send.fault.message,
        hint: asRadioErrorHint({ error: send.fault }),
      }),
      halt: isRadioUpstreamReasonHalt({ reason }),
    };
  }

  // mark it delivered, with the exid upstream holds it under
  return {
    fate: 'delivered',
    record: setRecord({
      dir,
      record,
      change: {
        recordStatus: RadioTaskRecordStatus.DELIVERED,
        reason: null,
        deliveredExid: send.sent.task.exid,
      },
    }),
    task: send.sent.task,
    outcome: send.sent.outcome,
  };
};
