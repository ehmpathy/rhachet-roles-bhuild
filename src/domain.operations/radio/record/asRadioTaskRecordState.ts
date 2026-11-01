import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioReasonBehindOnIssue } from './asRadioReasonBehindOnIssue';
import { isRadioUpstreamReasonHalt } from './isRadioUpstreamReasonHalt';

/**
 * .what = the plain-word state of one held record, as `queue get` shows it
 * .why = a reason code (`upstream:access`) names the fault; the state names what it means for
 *        the record — at a gate a human must lift, set aside on a fault of its own, halted
 *        behind a wall every record would hit, behind an earlier update to the same issue,
 *        or simply not reached yet
 */
export const asRadioTaskRecordState = (input: {
  record: RadioTaskRecord;
  lift: string | null;
}):
  | 'held at gate'
  | 'set aside'
  | 'halted'
  | 'waits behind'
  | 'not reached' => {
  // a shut gate holds it, whatever the last fault was
  if (input.lift) return 'held at gate';

  // an earlier update to the same issue still waits; this one goes after it
  const reason = input.record.reason;
  if (asRadioReasonBehindOnIssue({ reason })) return 'waits behind';

  // a wall (rate limit, outage) halts the line; it is no fault of this record
  if (reason && isRadioUpstreamReasonHalt({ reason })) return 'halted';

  // any other upstream fault is this record's own
  if (reason?.startsWith('upstream:')) return 'set aside';

  // no fault on record (never tried, or held at a gate since opened)
  return 'not reached';
};
