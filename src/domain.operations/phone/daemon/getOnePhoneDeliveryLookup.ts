import type { PhoneMailboxEntry } from '@src/access/daos/daoPhoneMailbox';
import type { PhoneAddress } from '@src/domain.objects/phone/PhoneAddress';
import { PhonePeer } from '@src/domain.objects/phone/PhonePeer';

import { asPhoneAddressFromInput } from '../address/asPhoneAddressFromInput';
import type { PhoneReach } from '../peer/getOnePhoneReach';
import { isPhonePeerInReach } from '../peer/isPhonePeerInReach';
import { getOnePhoneTreeDir } from '../tree/getOnePhoneTreeDir';
import { asPhoneReasonOfPeerReach } from './asPhoneReasonOfPeerReach';
import { getOnePhonePeerOfTree } from './getOnePhonePeerOfTree';
import type { PhoneDaemonContext } from './PhoneDaemonContext';

/**
 * .what = where one text would go, as read before any claim is taken
 * .note = `peerClone` is the seat the peer sits in — its slug, or its serial where it has none —
 *         and keys the `in` copy, so the copy lands in the mailbox the seat keeps across a revive
 */
export type PhoneDeliveryLookup =
  | { kind: 'wait'; reason: string }
  | { kind: 'refuse'; reason: string }
  | {
      kind: 'ready';
      peerTreeDir: string;
      peerClone: string;
      to: PhoneAddress;
    }
  | { kind: 'fault'; error: unknown };

/**
 * .what = the sender's reach, as the tick read it for the mailbox the text sits in
 */
export type PhoneDeliverySenderReach = Pick<
  PhoneReach,
  'contacts' | 'inbound' | 'contactsUnreadable'
>;

/**
 * .what = reads where one text would go — its grove, its peer tree, its peer, and whether the
 *         sender may still reach that peer — and so whether it waits, is refused, or is ready
 * .why = this table is the delivery policy. it is read-only, so it runs with no claim held; the
 *        claim then spans only local writes and the say, and a withdraw is refused only while one
 *        of those is in flight
 *
 * .note = admission is checked here as at the send: a contact revoked while a text sat QUEUED
 *         stops it, so who a clone may reach holds for the life of a text, not its first second
 * .note = a DEAD peer that the text names by its serial can never take it: a revive mints a new
 *         serial, so the text settles REFUSED rather than wait for a clone that can not return.
 *         a DEAD peer named by its slug may be revived under that slug, so it waits
 */
export const getOnePhoneDeliveryLookup = async (
  input: {
    entry: PhoneMailboxEntry;
    treeDir: string;
    treeSelf: string;
    sender: PhoneDeliverySenderReach;
  },
  context: PhoneDaemonContext,
): Promise<PhoneDeliveryLookup> => {
  // a peer on another grove waits; this delivery carries no grove leg
  const to = asPhoneAddressFromInput({
    raw: input.entry.record.to,
    self: { grove: context.groveSelf, tree: input.treeSelf },
  });
  if (to.grove !== context.groveSelf)
    return { kind: 'wait', reason: 'grove leg not in this delivery' };

  // a peer tree that is gone can never take it
  const peerTreeDir = await getOnePhoneTreeDir(
    { tree: to.tree, treeDirSelf: input.treeDir, treeSelf: input.treeSelf },
    context,
  );
  if (!peerTreeDir)
    return {
      kind: 'refuse',
      reason: `no tree ${to.tree} on ${context.groveSelf}`,
    };

  // a peer no clone in that tree answers to can not take it; no say is spent to learn so
  const peer = await getOnePhonePeerOfTree(
    { peerTreeDir, clone: to.clone },
    context,
  );
  if (!peer)
    return {
      kind: 'refuse',
      reason: `no clone answers to @:${to.clone} in that tree`,
    };

  // a peer beyond the sender's own tree must still be in reach; an unreadable contacts file is
  // a fault a human repairs, so the text waits on it rather than settle on a guess
  if (peerTreeDir !== input.treeDir) {
    if (input.sender.contactsUnreadable)
      return {
        kind: 'wait',
        reason: `sender contacts unreadable: ${input.sender.contactsUnreadable.path}`,
      };
    const isInReach = isPhonePeerInReach({
      peer: new PhonePeer({
        address: to,
        treeDir: peerTreeDir,
        serial: peer.serial,
        reachState: peer.reachState,
      }),
      reach: input.sender,
    });
    if (!isInReach)
      return {
        kind: 'refuse',
        reason: `${input.entry.record.to} is no longer a contact`,
      };
  }

  // a dead peer named by its serial can never return; a dead or deaf seat may
  if (peer.reachState === 'DEAD' && to.clone === peer.serial)
    return {
      kind: 'refuse',
      reason: `peer clone ${to.clone} is DEAD and has no slug to revive under`,
    };
  if (peer.reachState !== 'LIVE')
    return {
      kind: 'wait',
      reason: asPhoneReasonOfPeerReach({
        reachState: peer.reachState,
        reachCause: null,
      }),
    };

  return {
    kind: 'ready',
    peerTreeDir,
    peerClone: peer.slug ?? peer.serial,
    to,
  };
};
