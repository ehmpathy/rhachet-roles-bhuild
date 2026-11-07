import {
  daoPhoneMailbox,
  type PhoneMailboxEntry,
} from '@src/access/daos/daoPhoneMailbox';

/**
 * .what = every record in one seat's mailbox, for a test; fails loud on any unreadable file
 * .why = prod code reads tolerantly (`getAllReadable`); a test wants the whole mailbox and must
 *        see a record it wrote that no longer parses, never a silent skip
 * .note = `clone` is the seat's name: the clone's slug, or its serial where it has none
 */
export const getAllPhoneMailboxEntries = async (input: {
  treeDir: string;
  clone: string;
}): Promise<PhoneMailboxEntry[]> => {
  const { entries, unreadable } = await daoPhoneMailbox.getAllReadable(input);
  if (unreadable.length > 0)
    throw new Error(
      `mailbox holds unreadable records: ${JSON.stringify(unreadable)}`,
    );
  return entries;
};
