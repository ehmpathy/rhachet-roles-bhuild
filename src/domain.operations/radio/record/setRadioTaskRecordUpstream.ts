import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { getOneRadioUsagePermissionDecision } from '@src/domain.operations/radio/permission/getOneRadioUsagePermissionDecision';

import { asRadioAuthDeriveStallError } from './asRadioAuthDeriveStallError';
import { asRadioContextWithSendLimit } from './asRadioContextWithSendLimit';
import { asRadioDrainStepBound } from './asRadioDrainStepBound';
import { asRadioErrorDetail } from './asRadioErrorDetail';
import { asRadioErrorHeadline } from './asRadioErrorHeadline';
import { asRadioErrorHint } from './asRadioErrorHint';
import { asRadioFateRepushedMidSend } from './asRadioFateRepushedMidSend';
import { asRadioFateUnreachedByBudget } from './asRadioFateUnreachedByBudget';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import { asRadioUpstreamReason } from './asRadioUpstreamReason';
import type { RadioDrainDeadline } from './genRadioDrainDeadline';
import {
  RADIO_DRAIN_AUTH_DERIVE_CAP,
  RADIO_DRAIN_SEND_LIMIT_DEFAULT,
} from './genRadioDrainSendBudget';
import { genRadioGhSendLimit } from './genRadioGhSendLimit';
import { getOneRaceWithinBound } from './getOneRaceWithinBound';
import { getOneRadioContextForRecord } from './getOneRadioContextForRecord';
import { isRadioDrainDeadlineNear } from './isRadioDrainDeadlineNear';
import { isRadioDrainStepClippedByDeadline } from './isRadioDrainStepClippedByDeadline';
import { isRadioReplayRefusal } from './isRadioReplayRefusal';
import { isRadioTaskRecordRepushedSince } from './isRadioTaskRecordRepushedSince';
import { isRadioUpstreamReasonHalt } from './isRadioUpstreamReasonHalt';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import type { ShellExecutor } from './ShellExecutor';
import { setRadioTaskRecordHeldAtGate } from './setRadioTaskRecordHeldAtGate';
import { setRadioTaskRecordSettled } from './setRadioTaskRecordSettled';
import { setRadioTaskUpstreamFromRecord } from './setRadioTaskUpstreamFromRecord';

/**
 * .what = send one record upstream on its own terms, then settle its fate
 * .why = each record meets its own target's gate (X1) and its own channel + auth (C22);
 *        delivery reuses the extant upstream findsert, so a re-send never doubles (X2)
 *
 * .note = context.authOverride (a `drain --auth`) sends this record under that auth for
 *         this drain only; the record on disk keeps its own auth (F3)
 * .note = context.drainSendLimit bounds one send: each gh call and the whole send (default
 *         60s per call, 90s per send)
 * .note = context.drainDeadline (the lock's) bounds every step here: the auth derive, its
 *         shell, and the send each take at most what the drain has left. past it, the record
 *         is left QUEUED and unsent, never sent late, so a drain whose lease ran out cannot
 *         double-send a record a second drain now holds (X2)
 */
export const setRadioTaskRecordUpstream = async (
  input: { record: RadioTaskRecord; dir: string },
  context: {
    cwd: string;
    homeDir: string | undefined;
    env: NodeJS.ProcessEnv;
    shx: ShellExecutor;
    authOverride?: string | null;
    authLive?: { key: string; auth: string | null } | null;
    drainSendLimit?: {
      perCall: { milliseconds: number };
      perSend: { milliseconds: number };
    };
    drainDeadline: RadioDrainDeadline;
    drainAuthDeriveCap?: { milliseconds: number };
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

  // derive this record's own credentials, within its cap and what the drain has left
  const authCap = context.drainAuthDeriveCap ?? RADIO_DRAIN_AUTH_DERIVE_CAP;
  const authBound = asRadioDrainStepBound({
    cap: authCap,
    deadline: context.drainDeadline,
  });
  const authRace = await getOneRaceWithinBound({
    step: getOneRadioContextForRecord(
      {
        record,
        authOverride: context.authOverride ?? null,
        authLive: context.authLive ?? null,
      },
      {
        env: context.env,
        shx: (command) =>
          context.shx(command, {
            timeout: asRadioDrainStepBound({
              cap: authBound,
              deadline: context.drainDeadline,
            }),
          }),
      },
    ),
    bound: authBound,
  });
  // a derive the drain deadline cut short leaves the record queued and unsent, for the next
  // drain; a derive that outran its own cap is this record's auth fault, set aside with its fix
  if (
    'expired' in authRace &&
    isRadioDrainStepClippedByDeadline({ cap: authCap, bound: authBound })
  )
    return asRadioFateUnreachedByBudget({ record });
  const auth =
    'expired' in authRace
      ? { fault: asRadioAuthDeriveStallError({ cap: authCap }) }
      : authRace.value;

  // too near the deadline to send: leave it queued and unsent, for the next drain
  if (isRadioDrainDeadlineNear({ deadline: context.drainDeadline }))
    return asRadioFateUnreachedByBudget({ record });

  // hold if the credentials cannot be derived now
  if ('fault' in auth) {
    const heldOnAuth = setRadioTaskRecordSettled({
      dir,
      record,
      change: { reason: 'upstream:auth' },
    });

    // a re-push since the read is a new request: its fate is unknown, not this fault
    if (isRadioTaskRecordRepushedSince({ read: record, current: heldOnAuth }))
      return asRadioFateRepushedMidSend({ record: heldOnAuth });
    return {
      fate: 'held',
      record: heldOnAuth,
      lift: null,
      detail: asRadioErrorDetail({
        message: auth.fault.message,
        hint: asRadioErrorHint({ error: auth.fault }),
      }),
      halt: false,
    };
  }

  // send it, each gh call bound by what the send has left, and the send by what the drain
  // has left; a refusal closes it for good
  const sendLimit = context.drainSendLimit ?? RADIO_DRAIN_SEND_LIMIT_DEFAULT;
  const limit = genRadioGhSendLimit({
    perCall: sendLimit.perCall,
    perSend: asRadioDrainStepBound({
      cap: sendLimit.perSend,
      deadline: context.drainDeadline,
    }),
  });
  const send = await setRadioTaskUpstreamFromRecord(
    { record },
    asRadioContextWithSendLimit({ radioContext: auth.radioContext, limit }),
  );
  if ('fault' in send && isRadioReplayRefusal({ error: send.fault })) {
    const refused = setRadioTaskRecordSettled({
      dir,
      record,
      change: {
        recordStatus: RadioTaskRecordStatus.REFUSED,
        reason: asRadioErrorHeadline({ message: send.fault.message }),
      },
    });

    // a re-push since the read left the record queued: say so, not refused
    if (isRadioTaskRecordRepushedSince({ read: record, current: refused }))
      return asRadioFateRepushedMidSend({ record: refused });
    return {
      fate: 'refused',
      record: refused,
      detail: asRadioErrorHeadline({ message: send.fault.message }),
    };
  }

  // a fault holds it: a wall halts the drain; any other sets this one aside (#511)
  if ('fault' in send) {
    const reason = asRadioUpstreamReason({ message: send.faultText });
    const heldOnFault = setRadioTaskRecordSettled({
      dir,
      record,
      change: { reason },
    });

    // a re-push since the read is a new request: report it re-pushed, never the old fault;
    // a wall still halts the drain, since a rate limit or an outage binds every send
    if (isRadioTaskRecordRepushedSince({ read: record, current: heldOnFault }))
      return {
        ...asRadioFateRepushedMidSend({ record: heldOnFault }),
        halt: isRadioUpstreamReasonHalt({ reason }),
      };
    return {
      fate: 'held',
      record: heldOnFault,
      lift: null,
      detail: asRadioErrorDetail({
        message: send.fault.message,
        hint: asRadioErrorHint({ error: send.fault }),
      }),
      halt: isRadioUpstreamReasonHalt({ reason }),
    };
  }

  // mark it delivered, with the exid upstream holds it under
  const delivered = setRadioTaskRecordSettled({
    dir,
    record,
    change: {
      recordStatus: RadioTaskRecordStatus.DELIVERED,
      reason: null,
      deliveredExid: send.sent.task.exid,
    },
  });

  // a re-push since the read left the record queued: say so, not delivered
  if (isRadioTaskRecordRepushedSince({ read: record, current: delivered }))
    return asRadioFateRepushedMidSend({ record: delivered });
  return {
    fate: 'delivered',
    record: delivered,
    task: send.sent.task,
    outcome: send.sent.outcome,
  };
};
