import { RADIO_TASK_RECORD_KEY_GRAMMAR } from '@src/domain.objects/RadioTaskRecordKeyGrammar';

/**
 * .what = the shape of a `behind:<key> (same issue #N)` reason, with the dao's own key grammar
 * .why = a key the dao reads (a hand-named `legacy-a` among them) must read here too, or a
 *        record that waits behind it renders as not reached
 */
const REASON_BEHIND_ON_ISSUE_PATTERN = new RegExp(
  `^behind:(${RADIO_TASK_RECORD_KEY_GRAMMAR}) \\(same issue #([^)]+)\\)$`,
);

/**
 * .what = the record ahead and the issue, read from a `behind:<key> (same issue #N)` reason
 * .why = a record held behind an earlier update to the same issue is no fault of its own;
 *        every render must tell it apart from a fault, and name the record it waits on
 *
 * .note = null for any other reason
 */
export const asRadioReasonBehindOnIssue = (input: {
  reason: string | null;
}): { aheadKey: string; exid: string } | null => {
  const matched = REASON_BEHIND_ON_ISSUE_PATTERN.exec(input.reason ?? '');
  if (!matched) return null;
  return { aheadKey: matched[1]!, exid: matched[2]! };
};
