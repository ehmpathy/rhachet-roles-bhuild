import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioDeliveredExid } from './asRadioDeliveredExid';
import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';

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
