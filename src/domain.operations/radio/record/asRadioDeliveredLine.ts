import { MalfunctionError } from 'helpful-errors';

import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';

/**
 * .what = the exid upstream gave a delivered record
 * .why = every delivery sets it; a delivered record without one is malformed, and
 *        must fail loud rather than print `#null` as though it were an exid
 */
export const asRadioDeliveredExid = (input: {
  record: RadioTaskRecord;
}): string => {
  if (input.record.deliveredExid !== null) return input.record.deliveredExid;
  throw new MalfunctionError('delivered radio task record lacks its exid', {
    key: input.record.key,
    hint: 'fix or remove the malformed record file in the .radio dir',
  });
};

/**
 * .what = a delivered record as one line: exid + label
 * .why = a create reads by its new exid; an update already names its exid
 */
export const asRadioDeliveredLine = (input: {
  record: RadioTaskRecord;
}): string => {
  const label = asRadioTaskRecordLabel(input);
  if (input.record.kind === 'update') return label;
  return `#${asRadioDeliveredExid(input)} ${label}`;
};
