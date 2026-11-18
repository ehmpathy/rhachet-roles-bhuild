import { RadioChannel } from '@src/domain.objects/RadioChannel';
import {
  type ContextDispatchRadio,
  isContextGithubAuth,
} from '@src/domain.objects/RadioContext';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { assure } from '@src/infra/types/assure';

import { asRadioPromiseHoldDetail } from '../promise/asRadioPromiseHoldDetail';
import { asRadioContextWithSendLimit } from './asRadioContextWithSendLimit';
import type { RadioDrainDeadline } from './genRadioDrainDeadline';
import { genRadioGhSendLimitForStep } from './genRadioGhSendLimitForStep';
import { getOneRadioPromiseHold } from './getOneRadioPromiseHold';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import { setRadioTaskRecordHeld } from './setRadioTaskRecordHeld';

/**
 * .what = the promise gate: hold a record that would carry unvouched text to a public repo
 * .why = a task text sent to a public repo cannot be taken back, so no request that carries text
 *        goes out until the repo reads private, or the text comes with an anonymized promise
 *
 * .note = null → the request may run. a held fate → no request; the reason is the machine code
 * .note = the push's own record is dropped, not held: its caller is told to check its text and
 *         re-run with the promise, so a held twin would wait for a vouch that arrives on a fresh
 *         push anyway. the drop is the same settle as a hold, so a re-run that landed since the
 *         drain read the record is left untouched (the re-push guard)
 * .note = a read wall (a rate limit, an outage) halts the drain and holds the record in place
 */
export const setRadioTaskRecordHeldOnPromiseGate = async (
  input: {
    record: RadioTaskRecord;
    dir: string;
    promiseOverride: string | null;
  },
  context: {
    radioContext: ContextDispatchRadio<RadioChannel>;
    push: { key: string; auth: string | null } | null;
    drainSendLimit:
      | {
          perCall: { milliseconds: number };
          perSend: { milliseconds: number };
        }
      | undefined;
    drainDeadline: RadioDrainDeadline;
  },
): Promise<Extract<RadioTaskRecordFate, { fate: 'held' }> | null> => {
  // only a gh channel reaches a public page; the record's channel decides, never its context
  if (input.record.via !== RadioChannel.GH_ISSUES) return null;

  // read whether a hold is owed, the read bound by what the drain has left;
  // a gh record without a github context is a defect, so it fails loud, never open
  const limit = genRadioGhSendLimitForStep({
    sendLimit: context.drainSendLimit,
    deadline: context.drainDeadline,
  });
  const radioContext = assure(
    isContextGithubAuth,
    asRadioContextWithSendLimit({
      radioContext: assure(isContextGithubAuth, context.radioContext),
      limit,
    }),
  );
  const hold = await getOneRadioPromiseHold(
    { record: input.record, promiseOverride: input.promiseOverride },
    { radioContext },
  );
  if (!hold) return null;

  // a wall on the read: halt the drain, the record held in its place. the read runs only for a
  // record that owes a promise, so the gate is still ahead of it: say so, as a hint line
  if (hold.kind === 'wall')
    return setRadioTaskRecordHeld({
      record: input.record,
      dir: input.dir,
      change: { reason: hold.reason },
      detail: [
        `visibility read: ${hold.reason} (${hold.cause})`,
        '• a public repo will owe --promise once the read clears; pass it now if so',
      ].join('\n'),
      halt: true,
    });

  // a promise hold: the push's own record is dropped, any other is held for a vouch
  const isPushOwn = input.record.key === context.push?.key;
  return setRadioTaskRecordHeld({
    record: input.record,
    dir: input.dir,
    change: isPushOwn
      ? { recordStatus: RadioTaskRecordStatus.DROPPED, reason: hold.reason }
      : { reason: hold.reason },
    detail: asRadioPromiseHoldDetail({
      reason: hold.reason,
      cause: hold.cause,
    }),
    halt: false,
  });
};
