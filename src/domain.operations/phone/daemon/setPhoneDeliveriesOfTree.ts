import { ConstraintError } from 'helpful-errors';
import { types } from 'util';

import { daoPhoneContacts } from '@src/access/daos/daoPhoneContacts';
import {
  daoPhoneMailbox,
  type PhoneMailboxClaimAct,
  type PhoneMailboxEntry,
} from '@src/access/daos/daoPhoneMailbox';
import { isRhachetSpawnFault } from '@src/access/sdks/sdkRhachetClone';
import type { PhoneAddress } from '@src/domain.objects/phone/PhoneAddress';
import { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import { asPhoneInboundSenders } from '../peer/asPhoneInboundSenders';
import { asPhoneTextSaid } from '../render/asPhoneTextSaid';
import { isPhoneTextQueuedOut } from '../text/isPhoneTextQueuedOut';
import { setPhoneTextFaultedIfSayStale } from '../text/setPhoneTextFaultedIfSayStale';
import { withPhoneRosterMemo } from '../withPhoneRosterMemo';
import { asPhoneReasonOfError } from './asPhoneReasonOfError';
import { asPhoneSayOutcome } from './asPhoneSayOutcome';
import {
  getOnePhoneDeliveryLookup,
  type PhoneDeliveryLookup,
  type PhoneDeliverySenderReach,
} from './getOnePhoneDeliveryLookup';
import type { PhoneDaemonContext } from './PhoneDaemonContext';
import { setPhoneTextFailNotice } from './setPhoneTextFailNotice';
import { setPhoneTextReasonIfChanged } from './setPhoneTextReasonIfChanged';
import { setPhoneTextSettledLoud } from './setPhoneTextSettledLoud';

type PhoneDeliveryFate = 'said' | 'waited' | 'settled';

/**
 * .what = one daemon tick: says every QUEUED text in every seat mailbox of one tree
 * .why = the daemon is per tree and serves each seat in it; a tick is the unit a test can run
 *        in-process, and the loop is a thin repeat of it
 *
 * .note = per text: look up the peer and the sender's reach with no claim held; then claim it as
 *         `prep`, read it fresh, mark the claim `say`, say it, then write the `in` copy and settle
 *         the `out` copy. so a withdraw never races a daemon write, never waits on a slow roster
 *         read, and all that follows a say is a local file write. a crash with a `say` claim on
 *         disk leaves the text to be settled FAULTED by the next claimant, never said twice
 * .note = each tick reads each peer tree's roster once, so a peer that comes and goes is seen
 *         the next tick, and a tick costs one rhachet exec per peer tree, not per text
 * .note = a fault in one text's delivery is held to that text: it is settled (or left QUEUED, for
 *         a fault that may pass) with its reason, and the tick moves on. a fault in that settle
 *         itself is not held — the daemon exits loud, and the claim on disk tells the next daemon
 *         what it must know. a record the mailbox can not read is logged and skipped
 * .note = once a text to a peer waits, the later texts from that sender to that peer wait this
 *         tick too, so a peer reads one sender's texts in the order they were sent
 * .note = a stop is read before each text, so a human's stop bites at the next text, not the
 *         next tick; a text not yet begun stays QUEUED on disk
 */
export const setPhoneDeliveriesOfTree = async (
  input: {
    treeDir: string;
    treeSelf: string;
    state: { isStopped: boolean };
  },
  contextOfDaemon: PhoneDaemonContext,
): Promise<Record<PhoneDeliveryFate, number>> => {
  // one roster read per peer tree per tick, shared by every text to that tree
  const context: PhoneDaemonContext = {
    ...contextOfDaemon,
    sdkClone: withPhoneRosterMemo({ sdkClone: contextOfDaemon.sdkClone }),
  };
  const clones = await daoPhoneMailbox.getAllMailboxClones({
    treeDir: input.treeDir,
  });
  // .note = deliberate mutation: a tick-local tally, and the sender→peer pairs that wait
  const tally: Record<PhoneDeliveryFate, number> = {
    said: 0,
    waited: 0,
    settled: 0,
  };
  const pairsWaited = new Set<string>();
  for (const clone of clones) {
    // read the seat's mailbox, and the reach its texts are admitted against
    const { entries, unreadable } = await daoPhoneMailbox.getAllReadable({
      treeDir: input.treeDir,
      clone,
    });
    for (const bad of unreadable)
      context.log(`record skipped, unreadable: ${bad.path}: ${bad.reason}`);
    const sender = await getOnePhoneDeliverySenderReach({
      treeDir: input.treeDir,
      clone,
      entries,
    });

    for (const entry of entries) {
      if (input.state.isStopped) return tally;
      if (!isPhoneTextQueuedOut(entry)) continue;

      // an earlier text from this sender to this peer waits, so this one holds its place
      const pair = `${entry.record.from} → ${entry.record.to}`;
      if (pairsWaited.has(pair)) {
        tally.waited += 1;
        continue;
      }

      const fate = await setOnePhoneDelivery(
        {
          entry,
          treeDir: input.treeDir,
          treeSelf: input.treeSelf,
          sender,
        },
        context,
      );
      if (fate === 'waited') pairsWaited.add(pair);
      tally[fate] += 1;
    }
  }
  return tally;
};

/**
 * .what = the reach a seat's texts are admitted against: its contacts, and who texted it first
 */
const getOnePhoneDeliverySenderReach = async (input: {
  treeDir: string;
  clone: string;
  entries: PhoneMailboxEntry[];
}): Promise<PhoneDeliverySenderReach> => {
  const { addresses: contacts, unreadable: contactsUnreadable } =
    await daoPhoneContacts.getAll({
      treeDir: input.treeDir,
      clone: input.clone,
    });
  const inbound = asPhoneInboundSenders({ entries: input.entries, contacts });
  return { contacts, inbound, contactsUnreadable };
};

/**
 * .what = delivers one QUEUED text under its claim, and holds any fault to this one text
 */
const setOnePhoneDelivery = async (
  input: {
    entry: PhoneMailboxEntry;
    treeDir: string;
    treeSelf: string;
    sender: PhoneDeliverySenderReach;
  },
  context: PhoneDaemonContext,
): Promise<PhoneDeliveryFate> => {
  const { path } = input.entry;

  // look the peer up first, with no claim held: these reads are slow, and a withdraw must not
  // wait on them. a lookup fault is held, then settled under the claim like any other fault
  const lookup = await getOnePhoneDeliveryLookup(input, context).catch(
    (error: unknown): PhoneDeliveryLookup => ({ kind: 'fault', error }),
  );

  // claim it only for the writes and the say, so a withdraw can not land between a read and a write
  const { isClaimed, actStale } = await daoPhoneMailbox.genClaim({
    path,
    act: 'prep',
  });
  if (!isClaimed) return 'waited';

  const scope = {
    entry: input.entry,
    treeDir: input.treeDir,
    treeSelf: input.treeSelf,
  };
  const fate = await setOnePhoneDeliveryUnderClaim(
    { ...scope, actStale, lookup },
    context,
  ).catch((error: unknown) =>
    setOnePhoneDeliveryAfterFault({ ...scope, error }, context),
  );
  await daoPhoneMailbox.delClaim({ path });
  return fate;
};

/**
 * .what = settles one text whose delivery threw, by what the claim says of the say
 * .why = a say that may have fired is never said again: the text settles FAULTED. a fault before
 *        the say leaves the text unsaid: a caller-fixable cause (a tree two dirs answer to) settles
 *        it REFUSED with its reason; any other cause may pass, so it stays QUEUED, its reason set,
 *        and the next tick tries again
 * .note = a fault in this settle itself is not caught: the daemon exits loud, and the claim on
 *         disk tells the next daemon what it must know
 */
const setOnePhoneDeliveryAfterFault = async (
  input: {
    entry: PhoneMailboxEntry;
    treeDir: string;
    treeSelf: string;
    error: unknown;
  },
  context: PhoneDaemonContext,
): Promise<PhoneDeliveryFate> => {
  // only an error is settled; a thrown non-error is a defect, and halts loud
  if (!isError(input.error)) throw input.error;
  const { path } = input.entry;
  const reason = asPhoneReasonOfError({ error: input.error });
  const fresh = await daoPhoneMailbox.getOne({ path });
  if (fresh.record.status !== 'QUEUED') return 'settled';
  const scope = { treeDir: input.treeDir, treeSelf: input.treeSelf };

  // the say may have fired: settle it loud, never say it again
  const act = await daoPhoneMailbox.getClaimAct({ path });
  if (act === 'say') {
    await setPhoneTextSettledLoud(
      {
        ...scope,
        entry: fresh,
        status: 'FAULTED',
        reason: `said, then its settle failed (${reason}); not said again`,
      },
      context,
    );
    return 'settled';
  }

  // a caller-fixable cause will not pass on its own
  if (input.error instanceof ConstraintError) {
    await setPhoneTextSettledLoud(
      { ...scope, entry: fresh, status: 'REFUSED', reason },
      context,
    );
    return 'settled';
  }

  // all else may pass: it waits, with the reason named; logged once per change, not per tick
  const { isChanged } = await setPhoneTextReasonIfChanged({
    entry: fresh,
    reason: `retry: ${reason}`,
  });
  if (isChanged) context.log(`text ${fresh.record.uuid} faulted: ${reason}`);
  return 'waited';
};

/**
 * .what = settles a stale say, or acts on the lookup; the caller holds the claim
 * .note = the record is read fresh here, under the claim, so a withdraw that landed after the
 *         lookup is honored and never overwritten
 */
const setOnePhoneDeliveryUnderClaim = async (
  input: {
    entry: PhoneMailboxEntry;
    treeDir: string;
    treeSelf: string;
    actStale: PhoneMailboxClaimAct | null;
    lookup: PhoneDeliveryLookup;
  },
  context: PhoneDaemonContext,
): Promise<PhoneDeliveryFate> => {
  const scope = { treeDir: input.treeDir, treeSelf: input.treeSelf };

  // a dead daemon's say may have landed; settle it loud rather than say it twice
  const { entry, isFaulted } = await setPhoneTextFaultedIfSayStale({
    path: input.entry.path,
    actStale: input.actStale,
  });
  if (isFaulted) {
    await setPhoneTextFailNotice({ ...scope, record: entry.record }, context);
    return 'settled';
  }

  // honor a withdraw, or any settle, that landed after this tick began
  if (entry.record.status !== 'QUEUED') return 'settled';

  // a lookup that faulted is settled by the fault path, under this claim
  const { lookup } = input;
  if (lookup.kind === 'fault') throw lookup.error;

  // the peer can not take it yet: it waits, its reason named
  if (lookup.kind === 'wait') {
    await setPhoneTextReasonIfChanged({ entry, reason: lookup.reason });
    return 'waited';
  }

  // the peer can never take it: settle it, and tell the sender at once
  if (lookup.kind === 'refuse') {
    await setPhoneTextSettledLoud(
      { ...scope, entry, status: 'REFUSED', reason: lookup.reason },
      context,
    );
    return 'settled';
  }

  return setOnePhoneDeliverySaid(
    {
      ...scope,
      entry,
      peerTreeDir: lookup.peerTreeDir,
      peerClone: lookup.peerClone,
      to: lookup.to,
    },
    context,
  );
};

/**
 * .what = says one readied text and settles it
 * .note = the claim reads `say` from the instant before the say until its outcome is known; the
 *         peer seat is already in hand, so all after the say is a local write
 */
const setOnePhoneDeliverySaid = async (
  input: {
    entry: PhoneMailboxEntry;
    treeDir: string;
    treeSelf: string;
    peerTreeDir: string;
    peerClone: string;
    to: PhoneAddress;
  },
  context: PhoneDaemonContext,
): Promise<PhoneDeliveryFate> => {
  const { entry, peerTreeDir, to } = input;
  const { record } = entry;

  // say it into the peer clone; from the mark on, a crash may follow a say that landed
  await daoPhoneMailbox.setClaimAct({ path: entry.path, act: 'say' });
  const raw = await context.sdkClone
    .say({
      treeDir: peerTreeDir,
      clone: to.clone,
      what: asPhoneTextSaid({ record }),
    })
    .catch(async (error: unknown) => {
      // a say that never spawned can not have landed: the claim reads `prep` again, so the fault
      // path leaves the text QUEUED for the next tick rather than settle it FAULTED
      if (isRhachetSpawnFault(error))
        await daoPhoneMailbox.setClaimAct({ path: entry.path, act: 'prep' });
      throw error;
    });
  const outcome = asPhoneSayOutcome({ raw });

  // still waits: the say did not land, so the claim reads `prep` again; keep it QUEUED, say why,
  // and log only a new reason, so a peer held at a modal costs one line, not one per tick
  if (outcome.status === 'QUEUED') {
    await daoPhoneMailbox.setClaimAct({ path: entry.path, act: 'prep' });
    const { isChanged } = await setPhoneTextReasonIfChanged({
      entry,
      reason: outcome.reason,
    });
    if (isChanged)
      context.log(
        `text ${record.uuid} → ${record.to}: QUEUED ${outcome.reason}`,
      );
    return 'waited';
  }

  // delivered: write the `in` copy into the peer seat's mailbox, then settle the `out` copy
  if (outcome.status === 'DELIVERED') {
    await daoPhoneMailbox.gen({
      treeDir: peerTreeDir,
      clone: input.peerClone,
      record: new PhoneTextRecord({
        ...record,
        way: 'in',
        status: 'DELIVERED',
        reason: null,
      }),
    });
    await daoPhoneMailbox.set({ entry, status: 'DELIVERED', reason: null });
    context.log(`text ${record.uuid} → ${record.to}: DELIVERED`);
    return 'said';
  }

  // unconfirmed: settle it FAULTED, and tell the sender at once
  await setPhoneTextSettledLoud(
    {
      entry,
      treeDir: input.treeDir,
      treeSelf: input.treeSelf,
      status: outcome.status,
      reason: outcome.reason,
    },
    context,
  );
  return 'settled';
};

/**
 * .what = is this thrown value an error
 * .note = an fs fault is a native error from node's own realm, which `instanceof Error` can miss
 */
const isError = (value: unknown): value is Error =>
  value instanceof Error || types.isNativeError(value);
