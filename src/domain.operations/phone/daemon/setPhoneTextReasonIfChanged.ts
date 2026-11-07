import type { PhoneMailboxEntry } from '@src/access/daos/daoPhoneMailbox';

import { setPhoneTextStatus } from '../text/setPhoneTextStatus';
import type { PhoneDaemonContext } from './PhoneDaemonContext';

/**
 * .what = updates a QUEUED text's reason, only when it changed; says whether it did
 * .why = a text that waits across many ticks must not rewrite its file, nor log a line, nor
 *        mirror to its sender, every tick; the caller logs only on a change
 * .note = the caller holds the text's claim
 */
export const setPhoneTextReasonIfChanged = async (
  input: { entry: PhoneMailboxEntry; reason: string | null; treeDir: string },
  context: PhoneDaemonContext,
): Promise<{ isChanged: boolean }> => {
  if (input.entry.record.reason === input.reason) return { isChanged: false };
  await setPhoneTextStatus(
    {
      entry: input.entry,
      status: 'QUEUED',
      reason: input.reason,
      treeDir: input.treeDir,
    },
    context,
  );
  return { isChanged: true };
};
