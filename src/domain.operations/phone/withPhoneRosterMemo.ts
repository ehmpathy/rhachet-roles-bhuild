import type { PhoneTreeClone } from '@src/domain.objects/phone/PhoneTreeClone';

import type { PhoneContext } from './PhoneContext';

/**
 * .what = the clone sdk, with each tree's roster read at most once for the life of the wrap
 * .why = one roster read is one rhachet exec; a cli call and a daemon tick each read the same
 *        tree from several steps, and need one view of it
 * .note = a one-shot cli wraps once per call; the long-lived daemon wraps once per tick, so it
 *         still sees a peer come and go between ticks
 */
export const withPhoneRosterMemo = (input: {
  sdkClone: PhoneContext['sdkClone'];
}): PhoneContext['sdkClone'] => {
  // .note = deliberate mutation: the memo is the wrap's own state, never shared beyond it
  const rosters = new Map<string, Promise<PhoneTreeClone[]>>();
  return {
    say: input.sdkClone.say,
    getAllClones: (call) => {
      const found = rosters.get(call.treeDir);
      if (found) return found;
      const roster = input.sdkClone.getAllClones(call);
      rosters.set(call.treeDir, roster);
      return roster;
    },
  };
};
