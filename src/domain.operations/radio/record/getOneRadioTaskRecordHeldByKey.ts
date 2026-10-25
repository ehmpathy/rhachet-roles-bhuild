import { ConstraintError } from 'helpful-errors';

import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { getOneRadioTaskRecordByKey } from './getOneRadioTaskRecordByKey';
import { isRadioTaskRecordHeld } from './isRadioTaskRecordHeld';

/**
 * .what = the held record of one key, or a constraint that names why it cannot be acted on
 * .why = `set` and `del` act only on a record that still waits; an absent key or a settled
 *        record is the caller's to fix, so each fails loud with the next move
 */
export const getOneRadioTaskRecordHeldByKey = (
  input: { key: string; verb: 'set' | 'del' },
  context: { cwd: string },
): { record: RadioTaskRecord; dir: string } => {
  // the key must name a record in this worktree
  const found = getOneRadioTaskRecordByKey(
    { key: input.key, dirHome: null },
    context,
  );
  if (!found)
    throw new ConstraintError(
      `no radio record with key ${input.key} in this worktree; run \`rhx radio.task.queue get\` to list the keys`,
    );

  // the record must still wait; a settled one is past any amend or drop
  if (!isRadioTaskRecordHeld(found))
    throw new ConstraintError(
      `radio record ${input.key} is ${found.record.recordStatus}, not held; \`queue ${input.verb}\` acts only on a held record`,
    );
  return found;
};
