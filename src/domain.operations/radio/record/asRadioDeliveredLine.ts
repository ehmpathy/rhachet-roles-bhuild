import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioDeliveredExid } from './asRadioDeliveredExid';
import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';

/**
 * .what = a delivered record as one line: exid + label
 * .why = a create reads by its new exid; an update or a comment already names its exid
 */
export const asRadioDeliveredLine = (input: {
  record: RadioTaskRecord;
}): string => {
  const label = asRadioTaskRecordLabel(input);
  if (input.record.kind !== 'create') return label;
  return `#${asRadioDeliveredExid(input)} ${label}`;
};
