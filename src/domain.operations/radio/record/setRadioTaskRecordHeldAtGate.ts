import type { RadioPermissionDecision } from '@src/domain.objects/RadioPermissions';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioGateBlockedReason } from './asRadioGateBlockedReason';
import { asRadioLiftCommand } from './asRadioLiftCommand';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import { setRadioTaskRecordSettled } from './setRadioTaskRecordSettled';

/**
 * .what = hold a record at the shut gate its caller already read, reason recorded
 * .why = this write is the one place a shut gate becomes a held record, so the
 *        hold reason and lift cannot drift between the push and the drain step
 *
 * .note = a shut push reads its gate once. an open push reads it again inside the
 *         drain, where each record meets its own gate (X1) in the order of the line;
 *         the write goes through setRadioTaskRecordSettled, so a re-push mid-drain keeps its body,
 *         save one that lands between that settle's read and its write — a window of
 *         microseconds, which a per-key lock would close (F13)
 */
export const setRadioTaskRecordHeldAtGate = (input: {
  record: RadioTaskRecord;
  dir: string;
  gate: RadioPermissionDecision;
}): Extract<RadioTaskRecordFate, { fate: 'held' }> => ({
  fate: 'held',
  record: setRadioTaskRecordSettled({
    dir: input.dir,
    record: input.record,
    change: { reason: asRadioGateBlockedReason({ gate: input.gate }) },
  }),
  lift: asRadioLiftCommand({
    level: input.gate.level,
    owner: input.record.repo.owner,
  }),
  detail: null,
  halt: false,
});
