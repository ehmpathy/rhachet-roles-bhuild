import {
  daoPhoneMailbox,
  type PhoneMailboxEntry,
} from '@src/access/daos/daoPhoneMailbox';
import type { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import type { PhoneContext } from '../PhoneContext';
import { setPhoneTextOutMirror } from './setPhoneTextOutMirror';

/**
 * .what = writes the status and reason of an `in` copy, then mirrors them onto the sender's `out`
 * .why = the one write path for a text's fate: no settle can forget to tell the sender's thread
 * .note = the caller holds the claim on the `in` copy, and passes the entry it read under it
 */
export const setPhoneTextStatus = async (
  input: {
    entry: PhoneMailboxEntry;
    status: PhoneTextRecord['status'];
    reason: string | null;
    treeDir: string;
  },
  context: Pick<PhoneContext, 'gitRoot' | 'groveSelf' | 'sdkGrove'> & {
    log: (line: string) => void;
  },
): Promise<PhoneMailboxEntry> => {
  const settled = await daoPhoneMailbox.set({
    entry: input.entry,
    status: input.status,
    reason: input.reason,
  });
  await setPhoneTextOutMirror(
    { record: settled.record, treeDir: input.treeDir },
    context,
  );
  return settled;
};
