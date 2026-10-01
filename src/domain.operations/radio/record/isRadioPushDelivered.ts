import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = did this push reach upstream, now or before
 * .why = a delivered or already-landed push exits 0; a held or refused one exits 2
 */
export const isRadioPushDelivered = (input: {
  pushed: RadioTaskRecordFate | { fate: 'landed'; record: RadioTaskRecord };
}): boolean =>
  input.pushed.fate === 'delivered' || input.pushed.fate === 'landed';
