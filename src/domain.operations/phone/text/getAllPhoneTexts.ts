import {
  daoPhoneMailbox,
  type PhoneMailboxEntry,
} from '@src/access/daos/daoPhoneMailbox';
import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';

/**
 * .what = this clone's whole thread, in write order, plus each record file it could not read
 * .why = a clone reads its own mailbox alone; the read of the thread has one owner, beside the
 *        read of one text by its reference. the thread is the audit trail, so a record it can
 *        not read is counted back to the reader, never hidden
 */
export const getAllPhoneTexts = async (input: {
  self: PhoneSelf;
}): Promise<{
  entries: PhoneMailboxEntry[];
  unreadable: { path: string; reason: string }[];
}> =>
  daoPhoneMailbox.getAllReadable({
    treeDir: input.self.treeDir,
    clone: input.self.address.clone,
  });
