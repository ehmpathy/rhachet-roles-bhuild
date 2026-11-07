import type { PhoneMailboxEntry } from '@src/access/daos/daoPhoneMailbox';

import { setPhoneTextStatus } from '../text/setPhoneTextStatus';
import type { PhoneDaemonContext } from './PhoneDaemonContext';
import { setPhoneTextFailNotice } from './setPhoneTextFailNotice';

/**
 * .what = settles a text REFUSED or FAULTED, logs it, and tells its sender at once
 * .why = every settle that fails a text owes the sender a notice; one operation writes, mirrors,
 *        logs, and notifies, so no settle path can forget the notice
 * .note = the caller holds the claim on the `in` copy, and passes the entry it read under it
 */
export const setPhoneTextSettledLoud = async (
  input: {
    entry: PhoneMailboxEntry;
    status: 'REFUSED' | 'FAULTED';
    reason: string;
    treeDir: string;
  },
  context: PhoneDaemonContext,
): Promise<void> => {
  const settled = await setPhoneTextStatus(input, context);
  context.log(
    `text ${settled.record.uuid} → ${settled.record.to}: ${input.status} ${input.reason}`,
  );
  await setPhoneTextFailNotice(
    { record: settled.record, treeDir: input.treeDir },
    context,
  );
};
