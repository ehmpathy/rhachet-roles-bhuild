import {
  daoPhoneMailbox,
  type PhoneMailboxEntry,
} from '@src/access/daos/daoPhoneMailbox';

import type { PhoneDaemonContext } from './PhoneDaemonContext';
import { setPhoneTextFailNotice } from './setPhoneTextFailNotice';

/**
 * .what = settles a text REFUSED or FAULTED, logs it, and tells its sender at once
 * .why = every settle that fails a text owes the sender a notice; one operation writes, logs, and
 *        notifies, so no settle path can forget the notice
 * .note = the caller holds the text's claim, and passes the entry it read under that claim
 */
export const setPhoneTextSettledLoud = async (
  input: {
    entry: PhoneMailboxEntry;
    status: 'REFUSED' | 'FAULTED';
    reason: string;
    treeDir: string;
    treeSelf: string;
  },
  context: PhoneDaemonContext,
): Promise<void> => {
  const settled = await daoPhoneMailbox.set({
    entry: input.entry,
    status: input.status,
    reason: input.reason,
  });
  context.log(
    `text ${settled.record.uuid} → ${settled.record.to}: ${input.status} ${input.reason}`,
  );
  await setPhoneTextFailNotice(
    {
      record: settled.record,
      treeDir: input.treeDir,
      treeSelf: input.treeSelf,
    },
    context,
  );
};
