import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { isRadioRecordAuthReplayable } from './isRadioRecordAuthReplayable';

/**
 * .what = the amend line for a held record whose stored auth no drain will replay
 * .why = a held push promises "the next push delivers it", yet a stored shx auth (or an env var
 *        with no TOKEN segment) is never replayed from a record file; the record would then fault
 *        as `upstream:auth` after the lift. the caller must hear it at hold time, with the fix
 *
 * .note = the line names the act alone; the fact that the auth will not replay rides once, on the
 *         record's `auth:` line (asRadioAuthShown), beside it
 * .note = the fix names a placeholder, never the stored auth: a record can arrive by a merge, and
 *         a planted `shx(...)` echoed into a paste-ready line would hand that shell to whoever runs it
 */
export const asRadioReplayWarnLines = (input: {
  record: RadioTaskRecord;
}): string[] => {
  const { auth, key } = input.record;
  if (auth === null || isRadioRecordAuthReplayable({ auth })) return [];
  return [
    `amend its auth (human): rhx radio.task.queue set --uuid ${key} --auth <auth>`,
  ];
};
