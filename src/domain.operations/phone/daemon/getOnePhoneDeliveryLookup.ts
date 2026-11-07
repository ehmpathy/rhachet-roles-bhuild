import { basename } from 'path';

import { daoPhoneContacts } from '@src/access/daos/daoPhoneContacts';
import { daoPhoneGroup } from '@src/access/daos/daoPhoneGroup';
import {
  daoPhoneMailbox,
  type PhoneMailboxEntry,
} from '@src/access/daos/daoPhoneMailbox';
import { PhoneAddress } from '@src/domain.objects/phone/PhoneAddress';
import { PhonePeer } from '@src/domain.objects/phone/PhonePeer';

import { asPhoneAddressFromInput } from '../address/asPhoneAddressFromInput';
import { asPhoneInboundSenders } from '../peer/asPhoneInboundSenders';
import { isPhonePeerInReach } from '../peer/isPhonePeerInReach';
import { getOnePhoneTreeDir } from '../tree/getOnePhoneTreeDir';
import { asPhoneReasonOfPeerReach } from './asPhoneReasonOfPeerReach';
import { getOnePhonePeerOfTree } from './getOnePhonePeerOfTree';
import type { PhoneDaemonContext } from './PhoneDaemonContext';

/**
 * .what = what the daemon may do with one QUEUED `in` copy, as read before any claim is taken
 */
export type PhoneDeliveryLookup =
  | { kind: 'wait'; reason: string }
  | { kind: 'refuse'; reason: string }
  | { kind: 'ready'; clone: string }
  | { kind: 'fault'; error: unknown };

/**
 * .what = reads whether one text held for a seat in this tree waits, is refused, or is ready
 * .why = this table is the delivery policy. it is read-only, so it runs with no claim held; the
 *        claim then spans only local writes and the say, and a withdraw is refused only while one
 *        of those is in flight
 *
 * .note = the seat is in this tree, so its roster is this tree's own: the daemon says into its
 *         own panes alone, and reaches no other tree's clones
 * .note = admission is checked here as at the send, for a sender on this grove: a contact revoked
 *         while a text sat QUEUED stops it, so who a clone may reach holds for the life of a
 *         text. a sender on another grove was admitted on its own grove, where its contacts live
 * .note = a DEAD seat that the text names by its serial can never take it: a revive mints a new
 *         serial, so the text settles REFUSED. a DEAD seat named by its slug may be revived
 *         under that slug, so it waits
 */
export const getOnePhoneDeliveryLookup = async (
  input: { entry: PhoneMailboxEntry; clone: string; treeDir: string },
  context: PhoneDaemonContext,
): Promise<PhoneDeliveryLookup> => {
  const { record } = input.entry;
  const treeSelf = basename(input.treeDir);

  // the seat must answer in this tree; no say is spent to learn so
  const seat = await getOnePhonePeerOfTree(
    { peerTreeDir: input.treeDir, clone: input.clone },
    context,
  );
  if (!seat)
    return {
      kind: 'refuse',
      // the sender reads this reason, so it names the receiver's tree as "that tree"
      reason: `no clone answers to @:${input.clone} in that tree`,
    };

  // a sender on this grove, in another tree, must still have this seat in reach
  const from = asPhoneAddressFromInput({
    raw: record.from,
    self: { grove: context.groveSelf, tree: treeSelf },
  });
  if (from.grove === context.groveSelf && from.tree !== treeSelf) {
    const reach = await getOneSenderReach(
      { from, groupUuid: record.group, treeDir: input.treeDir },
      context,
    );
    if (reach.kind === 'wait') return reach;
    const peer = new PhonePeer({
      address: new PhoneAddress({
        grove: context.groveSelf,
        tree: treeSelf,
        clone: seat.slug ?? seat.serial,
      }),
      treeDir: input.treeDir,
      serial: seat.serial,
      reachState: seat.reachState,
    });
    if (!isPhonePeerInReach({ peer, reach }))
      return {
        kind: 'refuse',
        reason: `${record.to} is no longer a contact of ${record.from}`,
      };
  }

  // a dead seat named by its serial can never return; a dead or deaf seat may
  if (seat.reachState === 'DEAD' && input.clone === seat.serial)
    return {
      kind: 'refuse',
      reason: `clone ${input.clone} is DEAD and has no slug to revive under`,
    };
  if (seat.reachState !== 'LIVE')
    return {
      kind: 'wait',
      reason: asPhoneReasonOfPeerReach({
        reachState: seat.reachState,
        reachCause: null,
      }),
    };

  return { kind: 'ready', clone: seat.slug ?? seat.serial };
};

/**
 * .what = the reach of a sender on this grove, read from the sender's own tree and seat
 * .note = an unreadable contacts file is a fault a human repairs, so the text waits on it rather
 *         than settle on a guess
 */
const getOneSenderReach = async (
  input: { from: PhoneAddress; groupUuid: string | null; treeDir: string },
  context: PhoneDaemonContext,
): Promise<
  | { kind: 'wait'; reason: string }
  | {
      kind: 'read';
      contacts: string[];
      inbound: string[];
      groupMates: string[];
    }
> => {
  const senderTreeDir = await getOnePhoneTreeDir(
    {
      tree: input.from.tree,
      treeDirSelf: input.treeDir,
      treeSelf: basename(input.treeDir),
    },
    context,
  );
  if (!senderTreeDir)
    return {
      kind: 'wait',
      reason: `sender tree ${input.from.tree} not found here`,
    };
  const seat = { treeDir: senderTreeDir, clone: input.from.clone };
  const [{ addresses: contacts, unreadable }, { entries }, groups] =
    await Promise.all([
      daoPhoneContacts.getAll(seat),
      daoPhoneMailbox.getAllReadable(seat),
      daoPhoneGroup.getAll(seat),
    ]);
  if (unreadable)
    return {
      kind: 'wait',
      reason: `sender contacts unreadable: ${unreadable.path}`,
    };
  const group = groups.find((one) => one.uuid === input.groupUuid);
  return {
    kind: 'read',
    contacts,
    inbound: asPhoneInboundSenders({ entries, contacts }),
    // only the group this text went to admits it; a group mate is reached by that group alone
    groupMates: group?.members ?? [],
  };
};
