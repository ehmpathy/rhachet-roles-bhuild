import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

/**
 * .what = a short human label for a record
 * .why = a create reads as its title; an update reads as the move it makes (claim #412)
 */
export const asRadioTaskRecordLabel = (input: {
  record: RadioTaskRecord;
}): string => {
  const { record } = input;
  if (record.kind === 'create') return record.title ?? '(untitled)';
  if (record.status === RadioTaskStatus.CLAIMED) return `claim #${record.exid}`;
  if (record.status === RadioTaskStatus.DELIVERED)
    return `deliver #${record.exid}`;
  return `update #${record.exid}`;
};
