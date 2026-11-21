import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';

/**
 * .what = does a held record hold back a later record on the same issue
 * .why = updates to one issue land in order (a deliver sent past its held claim is refused for
 *        good), so a later record waits behind an earlier update on its issue. a comment changes
 *        no lifecycle, so naught waits behind it: a comment that cannot send must never hold an
 *        issue's claim or deliver (F6 holds one way only — a comment waits behind an update)
 *
 * .note = a create (no exid) names no issue yet, so naught waits on it, and it waits on naught
 * .note = the one predicate for both the drain order and the drop's waiter count, so the two
 *         cannot drift
 */
export const isRadioTaskRecordAheadOnIssue = (input: {
  ahead: RadioTaskRecord;
  behind: RadioTaskRecord;
}): boolean => {
  // a comment changes no lifecycle, so naught waits behind it
  if (input.ahead.kind === 'comment') return false;

  // a create names no issue
  if (input.ahead.exid === null || input.behind.exid === null) return false;

  // the same issue: one channel, one repo, one exid
  return (
    input.ahead.exid === input.behind.exid &&
    input.ahead.via === input.behind.via &&
    asRadioTaskRepoSlug({ repo: input.ahead.repo }) ===
      asRadioTaskRepoSlug({ repo: input.behind.repo })
  );
};
