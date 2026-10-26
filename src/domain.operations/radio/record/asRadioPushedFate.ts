import { MalfunctionError } from 'helpful-errors';

import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioFateFromSettledRecord } from './asRadioFateFromSettledRecord';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = the fate of this push, from the fates the drain reported
 * .why = a push that already landed is not in the drain, and reads as landed (C3, C6); one a
 *        concurrent drain refused, or a `queue del` dropped, reads as refused with its why.
 *        a still-queued push the drain never saw is a defect: it must fail loud
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

  // not in the drain because another writer settled it: it landed, was refused, or was dropped
  const settled = asRadioFateFromSettledRecord({ record: input.record });
  if (settled) return settled;

  // not in the drain, yet still queued: the sweep missed it
  throw new MalfunctionError('push was held, yet the drain never reached it', {
    key: input.record.key,
    recordStatus: input.record.recordStatus,
    drained: input.fates.map((fate) => fate.record.key),
  });
};
