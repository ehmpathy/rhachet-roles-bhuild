import {
  daoPhoneMailbox,
  type PhoneMailboxClaimAct,
  type PhoneMailboxEntry,
} from '@src/access/daos/daoPhoneMailbox';

/**
 * .what = settles a QUEUED text FAULTED when the claim just won displaced a dead daemon's say
 * .why = a daemon that died between its say and its settle may have said the text already; to
 *        say it again would break delivered-once, so the text is settled loud instead — the same
 *        at-most-once rule an unconfirmed say follows (F5)
 *
 * .note = the caller holds the claim; the record is read fresh under it, and returned as it now
 *         stands, so the caller acts on the settled truth
 */
export const setPhoneTextFaultedIfSayStale = async (input: {
  path: string;
  actStale: PhoneMailboxClaimAct | null;
}): Promise<{ entry: PhoneMailboxEntry; isFaulted: boolean }> => {
  const entry = await daoPhoneMailbox.getOne({ path: input.path });

  // only a stale say on a text still QUEUED leaves its fate unknown
  if (input.actStale !== 'say' || entry.record.status !== 'QUEUED')
    return { entry, isFaulted: false };

  // settle it loud, never say it again
  const faulted = await daoPhoneMailbox.set({
    entry,
    status: 'FAULTED',
    reason:
      'a daemon stopped mid-say; it may have been said, so it is not said again',
  });
  return { entry: faulted, isFaulted: true };
};
