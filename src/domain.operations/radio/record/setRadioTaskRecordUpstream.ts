import { now } from 'iso-time';

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
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import type { ShellExecutor } from './ShellExecutor';
import { setRadioTaskRecordHeldAtGate } from './setRadioTaskRecordHeldAtGate';
import { setRadioTaskUpstreamFromRecord } from './setRadioTaskUpstreamFromRecord';

/**
 * .what = persist a record's new fate
 * .why = a shared write for held, refused, and delivered outcomes
 */
const setRecord = (input: {
  dir: string;
  record: RadioTaskRecord;
  change: Partial<RadioTaskRecord>;
}): RadioTaskRecord =>
  daoRadioTaskRecord.set.upsert({
    dir: input.dir,
    record: new RadioTaskRecord({ ...input.record, ...input.change }),
  });

/**
 * .what = send one record upstream on its own terms, then settle its fate
 * .why = each record meets its own target's gate (X1) and its own channel + auth (C22);
 *        delivery reuses the extant upstream findsert, so a re-send never doubles (X2)
 */
export const setRadioTaskRecordUpstream = async (
  input: { record: RadioTaskRecord; dir: string },
  context: {
    cwd: string;
    homeDir: string | undefined;
    env: NodeJS.ProcessEnv;
    shx: ShellExecutor;
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
  const auth = await getOneRadioContextForRecord({ record }, context);
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
          settledAt: now(),
        },
      }),
      detail: asRadioErrorHeadline({ message: send.fault.message }),
    };

  // a fault holds it, and halts the drain behind it
  if ('fault' in send)
    return {
      fate: 'held',
      record: setRecord({
        dir,
        record,
        change: {
          reason: asRadioUpstreamReason({ message: send.fault.message }),
        },
      }),
      lift: null,
      detail: asRadioErrorDetail({
        message: send.fault.message,
        hint: asRadioErrorHint({ error: send.fault }),
      }),
      halt: true,
    };

  // mark it delivered, with the exid upstream holds it under
  return {
    fate: 'delivered',
    record: setRecord({
      dir,
      record,
      change: {
        recordStatus: RadioTaskRecordStatus.DELIVERED,
        reason: null,
        settledAt: record.settledAt ?? now(),
        deliveredExid: send.sent.task.exid,
      },
    }),
    task: send.sent.task,
    outcome: send.sent.outcome,
  };
};
