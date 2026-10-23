import {
  daoPhoneMailbox,
  type PhoneMailboxEntry,
} from '@src/access/daos/daoPhoneMailbox';

/**
 * .what = updates a QUEUED text's reason, only when it changed; says whether it did
 * .why = a text that waits across many ticks must not rewrite its file, nor log a line, every
 *        tick; the caller logs only on a change
 * .note = the caller holds the text's claim
 */
export const setPhoneTextReasonIfChanged = async (input: {
  entry: PhoneMailboxEntry;
  reason: string | null;
}): Promise<{ isChanged: boolean }> => {
  if (input.entry.record.reason === input.reason) return { isChanged: false };
  await daoPhoneMailbox.set({
    entry: input.entry,
    status: 'QUEUED',
    reason: input.reason,
  });
  return { isChanged: true };
};
