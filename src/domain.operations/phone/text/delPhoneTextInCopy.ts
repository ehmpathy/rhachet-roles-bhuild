import {
  daoPhoneMailbox,
  type PhoneMailboxClaimAct,
} from '@src/access/daos/daoPhoneMailbox';
import type { PhoneTextStatus } from '@src/domain.objects/phone/PhoneTextStatus';

import type { PhoneContext } from '../PhoneContext';
import { setPhoneTextFaultedIfSayStale } from './setPhoneTextFaultedIfSayStale';

/**
 * .what = withdraws the `in` copy of one text in the seat inbox it waits in, under its claim
 * .why = the receiver tree's daemon claims the `in` copy to say it; a withdraw takes that same
 *        claim, so a withdraw that lands mid-say is refused, never overwritten by DELIVERED
 *
 * .note = the answer names what was found, so the caller (on this grove, or the inbox verb on
 *         another) refuses or settles the sender's `out` copy to match:
 *         - WITHDRAWN = it was QUEUED, and now is withdrawn, never said
 *         - SETTLED   = it was already settled; `statusBefore` names how
 *         - HELD      = the daemon holds its claim; `act` names what the daemon does
 *         - ABSENT    = no `in` copy waits here; the `out` copy may be withdrawn alone
 * .note = the `out` copy is not written here; the caller writes it, on its own grove
 */
export const delPhoneTextInCopy = async (
  input: { treeDir: string; clone: string; uuid: string },
  context: Pick<PhoneContext, 'gitRoot' | 'groveSelf' | 'sdkGrove'> & {
    log: (line: string) => void;
  },
): Promise<{
  outcome: 'WITHDRAWN' | 'SETTLED' | 'HELD' | 'ABSENT';
  statusBefore: PhoneTextStatus | null;
  act: PhoneMailboxClaimAct | null;
}> => {
  const found = await daoPhoneMailbox.getOneByUuid({ ...input, way: 'in' });
  if (!found) return { outcome: 'ABSENT', statusBefore: null, act: null };

  // hold the text's claim, so the daemon can not say it between this read and the withdraw
  const { isClaimed, actStale } = await daoPhoneMailbox.genClaim({
    path: found.path,
    act: 'withdraw',
  });
  if (!isClaimed)
    return {
      outcome: 'HELD',
      statusBefore: null,
      act: await daoPhoneMailbox.getClaimActOfHolder({ path: found.path }),
    };
  try {
    // a dead daemon's say may have landed; then it is settled, never withdrawn as unsaid
    const { entry } = await setPhoneTextFaultedIfSayStale(
      { path: found.path, actStale, treeDir: input.treeDir },
      context,
    );
    const statusBefore = entry.record.status;
    if (statusBefore === 'WITHDRAWN')
      return { outcome: 'WITHDRAWN', statusBefore, act: null };
    if (statusBefore !== 'QUEUED')
      return { outcome: 'SETTLED', statusBefore, act: null };
    await daoPhoneMailbox.set({
      entry,
      status: 'WITHDRAWN',
      reason: 'withdrawn by its sender; never said',
    });
    return { outcome: 'WITHDRAWN', statusBefore, act: null };
  } finally {
    await daoPhoneMailbox.delClaim({ path: found.path });
  }
};
