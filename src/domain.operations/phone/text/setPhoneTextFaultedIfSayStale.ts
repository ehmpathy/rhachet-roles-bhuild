import {
  daoPhoneMailbox,
  type PhoneMailboxClaimAct,
  type PhoneMailboxEntry,
} from '@src/access/daos/daoPhoneMailbox';

import type { PhoneContext } from '../PhoneContext';
import { setPhoneTextStatus } from './setPhoneTextStatus';

/**
 * .what = settles a QUEUED text FAULTED when the claim just won displaced a dead daemon's say
 * .why = a daemon that died between its say and its settle may have said the text already; to
 *        say it again would break delivered-once, so the text is settled loud instead — the same
 *        at-most-once rule an unconfirmed say follows (F5)
 *
 * .note = the caller holds the claim on the `in` copy; the record is read fresh under it, and
 *         returned as it now stands, so the caller acts on the settled truth
 */
export const setPhoneTextFaultedIfSayStale = async (
  input: {
    path: string;
    actStale: PhoneMailboxClaimAct | null;
    treeDir: string;
  },
  context: Pick<PhoneContext, 'gitRoot' | 'groveSelf' | 'sdkGrove'> & {
    log: (line: string) => void;
  },
): Promise<{ entry: PhoneMailboxEntry; isFaulted: boolean }> => {
  const entry = await daoPhoneMailbox.getOne({ path: input.path });

  // only a stale say on a text still QUEUED leaves its fate unknown
  if (input.actStale !== 'say' || entry.record.status !== 'QUEUED')
    return { entry, isFaulted: false };

  // settle it loud, never say it again
  const faulted = await setPhoneTextStatus(
    {
      entry,
      status: 'FAULTED',
      reason:
        'a daemon stopped mid-say; it may have been said, so it is not said again',
      treeDir: input.treeDir,
    },
    context,
  );
  return { entry: faulted, isFaulted: true };
};
