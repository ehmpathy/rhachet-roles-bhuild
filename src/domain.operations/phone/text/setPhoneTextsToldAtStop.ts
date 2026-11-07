import {
  daoPhoneMailbox,
  type PhoneMailboxEntry,
} from '@src/access/daos/daoPhoneMailbox';
import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';

import type { PhoneContext } from '../PhoneContext';
import { isPhoneTextQueuedIn } from './isPhoneTextQueuedIn';
import { setPhoneTextFaultedIfSayStale } from './setPhoneTextFaultedIfSayStale';
import { setPhoneTextStatus } from './setPhoneTextStatus';

/**
 * .what = the reason a text told at a stop carries, in place of a say
 */
const REASON_TOLD_AT_STOP = 'told at stop, by the onStop hook';

/**
 * .what = settles every text held for this seat as told, and returns them, for its stop hook
 * .why = the daemon is the main path, and it can fail; a clone's own stop is a second path that
 *        needs no daemon at all, so a text held for a clone reaches it the next time it stops
 *
 * .note = each text is claimed as the daemon claims it, and read fresh under the claim, so a text
 *         the daemon says at the same instant is told once, never twice. a stale `say` claim
 *         settles FAULTED, as the daemon would settle it, and is not told
 * .note = the settle is mirrored onto the sender's `out` copy, so the sender reads DELIVERED
 */
export const setPhoneTextsToldAtStop = async (
  input: { self: PhoneSelf },
  context: Pick<PhoneContext, 'gitRoot' | 'groveSelf' | 'sdkGrove'> & {
    log: (line: string) => void;
  },
): Promise<{ told: PhoneMailboxEntry[] }> => {
  const { treeDir } = input.self;
  const { entries } = await daoPhoneMailbox.getAllReadable({
    treeDir,
    clone: input.self.address.clone,
  });

  // .note = deliberate mutation: one at a time, so the told list follows the mailbox order
  const told: PhoneMailboxEntry[] = [];
  for (const entry of entries.filter((one) => isPhoneTextQueuedIn(one))) {
    const { isClaimed, actStale } = await daoPhoneMailbox.genClaim({
      path: entry.path,
      act: 'prep',
    });
    if (!isClaimed) continue; // the daemon holds it this instant; it says it
    try {
      const fresh = await setPhoneTextFaultedIfSayStale(
        { path: entry.path, actStale, treeDir },
        context,
      );
      if (fresh.entry.record.status !== 'QUEUED') continue;
      told.push(
        await setPhoneTextStatus(
          {
            entry: fresh.entry,
            status: 'DELIVERED',
            reason: REASON_TOLD_AT_STOP,
            treeDir,
          },
          context,
        ),
      );
    } finally {
      await daoPhoneMailbox.delClaim({ path: entry.path });
    }
  }
  return { told };
};
