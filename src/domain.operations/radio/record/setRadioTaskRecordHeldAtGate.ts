import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import type { RadioPermissionDecision } from '@src/domain.objects/RadioPermissions';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioGateBlockedReason } from './asRadioGateBlockedReason';
import { asRadioLiftCommand } from './asRadioLiftCommand';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = hold a record at the shut gate its caller already read, reason recorded
 * .why = this write is the one place a shut gate becomes a held record, so the
 *        hold reason and lift cannot drift between the push and the drain step
 *
 * .note = a shut push reads its gate once. an open push reads it again inside the
 *         drain, where each record meets its own gate (X1) in the order of the line
 */
export const setRadioTaskRecordHeldAtGate = (input: {
  record: RadioTaskRecord;
  dir: string;
  gate: RadioPermissionDecision;
}): Extract<RadioTaskRecordFate, { fate: 'held' }> => ({
  fate: 'held',
  record: daoRadioTaskRecord.set.upsert({
    dir: input.dir,
    record: new RadioTaskRecord({
      ...input.record,
      reason: asRadioGateBlockedReason({ gate: input.gate }),
    }),
  }),
  lift: asRadioLiftCommand({
    level: input.gate.level,
    owner: input.record.repo.owner,
  }),
  detail: null,
  halt: false,
});
