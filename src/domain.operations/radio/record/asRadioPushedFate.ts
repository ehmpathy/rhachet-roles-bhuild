import { MalfunctionError } from 'helpful-errors';

import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';

import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = the fate of this push, from the fates the drain reported
 * .why = a push that already landed is not in the drain, and reads as landed (C3, C6).
 *        a held push the drain never saw is a defect: it must fail loud, never read as delivered
 */
export const asRadioPushedFate = (input: {
  fates: RadioTaskRecordFate[];
  record: RadioTaskRecord;
}): RadioTaskRecordFate | { fate: 'landed'; record: RadioTaskRecord } => {
  // the drain carried this push: its fate is the one it reported
  const found = input.fates.find(
    (fate) => fate.record.key === input.record.key,
  );
  if (found) return found;

  // not in the drain because it already landed
  if (input.record.recordStatus === RadioTaskRecordStatus.DELIVERED)
    return { fate: 'landed', record: input.record };

  // not in the drain, yet held: the sweep missed it
  throw new MalfunctionError('push was held, yet the drain never reached it', {
    key: input.record.key,
    recordStatus: input.record.recordStatus,
    drained: input.fates.map((fate) => fate.record.key),
  });
};
