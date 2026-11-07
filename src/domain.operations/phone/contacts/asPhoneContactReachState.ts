import type { PhonePeer } from '@src/domain.objects/phone/PhonePeer';

/**
 * .what = the reach state a contact shows: `other grove`, its clone's state, or `no clone yet`
 * .note = a peer on another grove has no tree dir here, so its clone's state can not be read
 */
export const asPhoneContactReachState = (input: {
  peer: PhonePeer;
}): string => {
  if (input.peer.treeDir === null) return 'other grove';
  return input.peer.reachState ?? 'no clone yet';
};
