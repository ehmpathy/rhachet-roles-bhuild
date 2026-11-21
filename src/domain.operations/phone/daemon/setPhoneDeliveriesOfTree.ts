import { ConstraintError } from 'helpful-errors';
import { types } from 'util';

import {
  daoPhoneMailbox,
  type PhoneMailboxClaimAct,
  type PhoneMailboxEntry,
} from '@src/access/daos/daoPhoneMailbox';
import { isRhachetSpawnFault } from '@src/access/sdks/sdkRhachetClone';

import { asPhoneTextSaid } from '../render/asPhoneTextSaid';
import { isPhoneTextQueuedIn } from '../text/isPhoneTextQueuedIn';
import { setPhoneTextFaultedIfSayStale } from '../text/setPhoneTextFaultedIfSayStale';
import { setPhoneTextStatus } from '../text/setPhoneTextStatus';
import { withPhoneRosterMemo } from '../withPhoneRosterMemo';
import { asPhoneReasonOfError } from './asPhoneReasonOfError';
import { asPhoneSayOutcome } from './asPhoneSayOutcome';
import {
  getOnePhoneDeliveryLookup,
  type PhoneDeliveryLookup,
} from './getOnePhoneDeliveryLookup';
import type { PhoneDaemonContext } from './PhoneDaemonContext';
import { setPhoneTextFailNotice } from './setPhoneTextFailNotice';
import { setPhoneTextReasonIfChanged } from './setPhoneTextReasonIfChanged';
import { setPhoneTextSettledLoud } from './setPhoneTextSettledLoud';

type PhoneDeliveryFate = 'said' | 'waited' | 'settled';

/**
 * .what = one daemon tick: says every QUEUED text held in every seat inbox of this tree
 * .why = delivery is the receiver's: a sender writes into the receiver seat's inbox, and the
 *        receiver tree's daemon says each text into its own pane. a tick is the unit a test can
 *        run in-process, and the loop is a thin repeat of it
 *
 * .note = per text: look up the seat and the sender's reach with no claim held; then claim the
 *         `in` copy as `prep`, read it fresh, mark the claim `say`, say it, then settle it and
 *         mirror the settle onto the sender's `out` copy. so a withdraw never races a daemon
 *         write, and never waits on a slow roster read. a crash with a `say` claim on disk leaves
 *         the text to be settled FAULTED by the next claimant, never said twice
 * .note = each tick reads this tree's roster once, so a seat that comes and goes is seen the next
 *         tick
 * .note = a fault in one text's delivery is held to that text: it is settled (or left QUEUED, for
 *         a fault that may pass) with its reason, and the tick moves on. a fault in that settle
 *         itself is not held — the daemon exits loud, and the claim on disk tells the next daemon
 *         what it must know. a record the mailbox can not read is logged and skipped
 * .note = once a text from a sender to a seat waits, the later texts from that sender to that seat
 *         wait this tick too, so a seat reads one sender's texts in the order they were sent
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
  // one roster read per tick, shared by every text held here
  const context: PhoneDaemonContext = {
    ...contextOfDaemon,
    sdkClone: withPhoneRosterMemo({ sdkClone: contextOfDaemon.sdkClone }),
  };
  const clones = await daoPhoneMailbox.getAllMailboxClones({
    treeDir: input.treeDir,
  });
  // .note = deliberate mutation: a tick-local tally, and the sender→seat pairs that wait
  const tally: Record<PhoneDeliveryFate, number> = {
    said: 0,
    waited: 0,
    settled: 0,
  };
  const pairsWaited = new Set<string>();
  for (const clone of clones) {
    // read the seat's inbox
    const { entries, unreadable } = await daoPhoneMailbox.getAllReadable({
      treeDir: input.treeDir,
      clone,
    });
    for (const bad of unreadable)
      context.log(`record skipped, unreadable: ${bad.path}: ${bad.reason}`);

    for (const entry of entries) {
      if (input.state.isStopped) return tally;
      if (!isPhoneTextQueuedIn(entry)) continue;

      // an earlier text from this sender to this seat waits, so this one holds its place
      const pair = `${entry.record.from} → ${clone}`;
      if (pairsWaited.has(pair)) {
        tally.waited += 1;
        continue;
      }

      const fate = await setOnePhoneDelivery(
        { entry, clone, treeDir: input.treeDir },
        context,
      );
      if (fate === 'waited') pairsWaited.add(pair);
      tally[fate] += 1;
    }
  }
  return tally;
};

/**
 * .what = delivers one QUEUED text under its claim, and holds any fault to this one text
 */
const setOnePhoneDelivery = async (
  input: { entry: PhoneMailboxEntry; clone: string; treeDir: string },
  context: PhoneDaemonContext,
): Promise<PhoneDeliveryFate> => {
  const { path } = input.entry;

  // look the seat up first, with no claim held: these reads are slow, and a withdraw must not
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

  const fate = await setOnePhoneDeliveryUnderClaim(
    { ...input, actStale, lookup },
    context,
  ).catch((error: unknown) =>
    setOnePhoneDeliveryAfterFault({ ...input, error }, context),
  );
  await daoPhoneMailbox.delClaim({ path });
  return fate;
};

/**
 * .what = settles one text whose delivery threw, by what the claim says of the say
 * .why = a say that may have fired is never said again: the text settles FAULTED. a fault before
 *        the say leaves the text unsaid: a caller-fixable cause settles it REFUSED with its
 *        reason; any other cause may pass, so it stays QUEUED, its reason set, and the next tick
 *        tries again
 * .note = a fault in this settle itself is not caught: the daemon exits loud, and the claim on
 *         disk tells the next daemon what it must know
 */
const setOnePhoneDeliveryAfterFault = async (
  input: { entry: PhoneMailboxEntry; treeDir: string; error: unknown },
  context: PhoneDaemonContext,
): Promise<PhoneDeliveryFate> => {
  // only an error is settled; a thrown non-error is a defect, and halts loud
  if (!isError(input.error)) throw input.error;
  const { path } = input.entry;
  const reason = asPhoneReasonOfError({ error: input.error });
  const fresh = await daoPhoneMailbox.getOne({ path });
  if (fresh.record.status !== 'QUEUED') return 'settled';

  // the say may have fired: settle it loud, never say it again
  const act = await daoPhoneMailbox.getClaimAct({ path });
  if (act === 'say') {
    await setPhoneTextSettledLoud(
      {
        entry: fresh,
        status: 'FAULTED',
        reason: `said, then its settle failed (${reason}); not said again`,
        treeDir: input.treeDir,
      },
      context,
    );
    return 'settled';
  }

  // a caller-fixable cause will not pass on its own
  if (input.error instanceof ConstraintError) {
    await setPhoneTextSettledLoud(
      { entry: fresh, status: 'REFUSED', reason, treeDir: input.treeDir },
      context,
    );
    return 'settled';
  }

  // all else may pass: it waits, with the reason named; logged once per change, not per tick
  const { isChanged } = await setPhoneTextReasonIfChanged(
    { entry: fresh, reason: `retry: ${reason}`, treeDir: input.treeDir },
    context,
  );
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
    actStale: PhoneMailboxClaimAct | null;
    lookup: PhoneDeliveryLookup;
  },
  context: PhoneDaemonContext,
): Promise<PhoneDeliveryFate> => {
  const { treeDir } = input;

  // a dead daemon's say may have landed; settle it loud rather than say it twice
  const { entry, isFaulted } = await setPhoneTextFaultedIfSayStale(
    { path: input.entry.path, actStale: input.actStale, treeDir },
    context,
  );
  if (isFaulted) {
    await setPhoneTextFailNotice({ record: entry.record, treeDir }, context);
    return 'settled';
  }

  // honor a withdraw, or any settle, that landed after this tick began
  if (entry.record.status !== 'QUEUED') return 'settled';

  // a lookup that faulted is settled by the fault path, under this claim
  const { lookup } = input;
  if (lookup.kind === 'fault') throw lookup.error;

  // the seat can not take it yet: it waits, its reason named
  if (lookup.kind === 'wait') {
    await setPhoneTextReasonIfChanged(
      { entry, reason: lookup.reason, treeDir },
      context,
    );
    return 'waited';
  }

  // the seat can never take it: settle it, and tell the sender at once
  if (lookup.kind === 'refuse') {
    await setPhoneTextSettledLoud(
      { entry, status: 'REFUSED', reason: lookup.reason, treeDir },
      context,
    );
    return 'settled';
  }

  return setOnePhoneDeliverySaid(
    { entry, treeDir, clone: lookup.clone },
    context,
  );
};

/**
 * .what = says one readied text into its seat's pane, and settles it
 * .note = the claim reads `say` from the instant before the say until its outcome is known; all
 *         after the say is a local write, plus the mirror to the sender
 */
const setOnePhoneDeliverySaid = async (
  input: { entry: PhoneMailboxEntry; treeDir: string; clone: string },
  context: PhoneDaemonContext,
): Promise<PhoneDeliveryFate> => {
  const { entry, treeDir } = input;
  const { record } = entry;

  // say it into the seat; from the mark on, a crash may follow a say that landed
  await daoPhoneMailbox.setClaimAct({ path: entry.path, act: 'say' });
  const raw = await context.sdkClone
    .say({ treeDir, clone: input.clone, what: asPhoneTextSaid({ record }) })
    .catch(async (error: unknown) => {
      // a say that never spawned can not have landed: the claim reads `prep` again, so the fault
      // path leaves the text QUEUED for the next tick rather than settle it FAULTED
      if (isRhachetSpawnFault(error))
        await daoPhoneMailbox.setClaimAct({ path: entry.path, act: 'prep' });
      throw error;
    });
  const outcome = asPhoneSayOutcome({ raw });

  // still waits: the say did not land, so the claim reads `prep` again; keep it QUEUED, say why,
  // and log only a new reason, so a seat held at a modal costs one line, not one per tick
  if (outcome.status === 'QUEUED') {
    await daoPhoneMailbox.setClaimAct({ path: entry.path, act: 'prep' });
    const { isChanged } = await setPhoneTextReasonIfChanged(
      { entry, reason: outcome.reason, treeDir },
      context,
    );
    if (isChanged)
      context.log(
        `text ${record.uuid} → ${record.to}: QUEUED ${outcome.reason}`,
      );
    return 'waited';
  }

  // delivered: settle the `in` copy, and mirror it onto the sender's `out` copy
  if (outcome.status === 'DELIVERED') {
    await setPhoneTextStatus(
      { entry, status: 'DELIVERED', reason: null, treeDir },
      context,
    );
    context.log(`text ${record.uuid} → ${record.to}: DELIVERED`);
    return 'said';
  }

  // unconfirmed: settle it FAULTED, and tell the sender at once
  await setPhoneTextSettledLoud(
    { entry, treeDir, status: outcome.status, reason: outcome.reason },
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
