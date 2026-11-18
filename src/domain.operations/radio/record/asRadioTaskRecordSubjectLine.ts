import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';

/**
 * .what = the fact line that names what a record is: `comment = #489`, or `task    = <label>`
 * .why = a comment is no task, so it never reads `task = comment on #489`; one source for every
 *        output that names a record (push, drop, amend)
 */
export const asRadioTaskRecordSubjectLine = (input: {
  record: RadioTaskRecord;
}): string => {
  if (input.record.kind === 'comment') return `comment = #${input.record.exid}`;
  return `task    = ${asRadioTaskRecordLabel(input)}`;
};
