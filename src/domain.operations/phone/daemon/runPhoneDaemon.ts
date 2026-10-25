import {
  type IsoDuration,
  type IsoTimeStamp,
  now,
  sleep,
  toMillisecondsSinceEpoch,
} from 'iso-time';
import { basename } from 'path';

import { daoPhoneDaemon } from '@src/access/daos/daoPhoneDaemon';
import { daoPhoneMailbox } from '@src/access/daos/daoPhoneMailbox';
import { genProcessStopHandlers } from '@src/infra/process/genProcessStopHandlers';

import type { PhoneContext } from '../PhoneContext';
import { isPhoneTextQueuedOut } from '../text/isPhoneTextQueuedOut';
import { getOnePhoneIdleExitAt } from './getOnePhoneIdleExitAt';
import { setPhoneDeliveriesOfTree } from './setPhoneDeliveriesOfTree';

/**
 * .what = the daemon's loop: claim the lock, tick until idle, release the lock
 * .why = one daemon per tree carries every clone's texts. it exits after a long idle with no
 *        QUEUED text, since the next send starts one again; a held lock never outlives it
 *
 * .note = `tick` is the poll span and `idleExit` the quiet span before it exits (F15); the cli
 *         holds their values, so a test can run the loop to idle in a moment
 * .note = a tick that throws is not caught: the daemon exits loud, its stack lands in its own
 *         log, and the lock is released, so the next send starts a fresh daemon and reports it.
 *         the texts stay QUEUED on disk; none is lost
 * .note = at idle exit the lock is released FIRST, then the mailboxes are read once more. a text
 *         written before the release is seen here and the lock is reclaimed; a text written after
 *         it finds no live daemon, so its sender starts one. no text is left with no daemon
 */
export const runPhoneDaemon = async (
  input: { treeDir: string; tick: IsoDuration; idleExit: IsoDuration },
  context: PhoneContext,
): Promise<{ outcome: 'idle' | 'stopped' | 'lock-held' }> => {
  const pid = process.pid;
  // a log line is diagnostic: a failed append is reported on stderr (the daemon's own log file
  // via its detached spawn), never left as an unhandled rejection that would kill delivery
  const log = (line: { text: string }): void =>
    void daoPhoneDaemon
      .setLogLine({ treeDir: input.treeDir, line: `[${pid}] ${line.text}` })
      .catch((error: unknown) =>
        console.error(
          `💥 MalfunctionError: phone daemon log append failed: ${String(error)}`,
        ),
      );

  // claim the lock, or leave the tree to the daemon that holds it
  const isClaimed = await daoPhoneDaemon.gen({ treeDir: input.treeDir, pid });
  if (!isClaimed) {
    log({ text: 'another daemon holds the lock; exit' });
    return { outcome: 'lock-held' };
  }
  log({ text: 'lock claimed; ticks begin' });

  // read a stop signal at the next loop turn
  const state = { isStopped: false }; // .note = deliberate mutation: set by the signal handler
  const { delHandlers } = genProcessStopHandlers({
    onStop: () => {
      state.isStopped = true;
    },
  });

  try {
    // tick until stopped or idle; on idle, release, then re-read before the exit is final
    while (true) {
      await setPhoneTicksUntilRest({ ...input, state }, { ...context, log });
      await daoPhoneDaemon.del({ treeDir: input.treeDir, pid });
      if (state.isStopped) {
        log({ text: 'stopped; lock released' });
        return { outcome: 'stopped' };
      }
      if (await isMailboxQuiet({ treeDir: input.treeDir })) {
        log({ text: 'idle; lock released' });
        return { outcome: 'idle' };
      }

      // a text landed as the daemon went idle: reclaim, or leave it to the daemon that did
      const isReclaimed = await daoPhoneDaemon.gen({
        treeDir: input.treeDir,
        pid,
      });
      if (!isReclaimed) {
        log({ text: 'a text landed at idle; another daemon holds it; exit' });
        return { outcome: 'lock-held' };
      }
      log({ text: 'a text landed at idle; lock reclaimed' });
    }
  } finally {
    // a crash releases the lock too; a no-op when this pid no longer holds it
    delHandlers();
    await daoPhoneDaemon.del({ treeDir: input.treeDir, pid });
  }
};

/**
 * .what = ticks until a stop signal, or until no QUEUED text has shown for the idle span
 * .note = each call ticks at least once before it reads the idle clock. a clock read first could
 *         find the span already past (the stamps hold whole seconds), return with no tick, and
 *         leave the caller to reclaim and call again with a QUEUED text never said
 */
const setPhoneTicksUntilRest = async (
  input: {
    treeDir: string;
    tick: IsoDuration;
    idleExit: IsoDuration;
    state: { isStopped: boolean };
  },
  context: PhoneContext & { log: (line: { text: string }) => void },
): Promise<void> => {
  const treeSelf = basename(input.treeDir);
  const idle = { exitAt: getOnePhoneIdleExitAt(input) }; // .note = deliberate mutation: the idle clock
  while (true) {
    await setPhoneDeliveriesOfTree(
      { treeDir: input.treeDir, treeSelf, state: input.state },
      { ...context, log: (line: string) => context.log({ text: line }) },
    );

    // a QUEUED text keeps the daemon awake; only a quiet tree counts toward idle, and only a
    // quiet tree may rest. a rest with a text still held would release the lock, find the text,
    // and reclaim it, once per tick, for as long as the text waits
    const isQuiet = await isMailboxQuiet({ treeDir: input.treeDir });
    if (!isQuiet) idle.exitAt = getOnePhoneIdleExitAt(input);
    if (input.state.isStopped) return;
    if (isQuiet && isPast({ at: idle.exitAt })) return;
    await sleep(input.tick);
  }
};

/**
 * .what = has this instant already passed
 */
const isPast = (input: { at: IsoTimeStamp }): boolean =>
  toMillisecondsSinceEpoch(input.at) <= toMillisecondsSinceEpoch(now());

/**
 * .what = does no mailbox in the tree hold a QUEUED `out` text
 */
const isMailboxQuiet = async (input: { treeDir: string }): Promise<boolean> => {
  const clones = await daoPhoneMailbox.getAllMailboxClones(input);
  for (const clone of clones) {
    const { entries } = await daoPhoneMailbox.getAllReadable({
      treeDir: input.treeDir,
      clone,
    });
    if (entries.some((entry) => isPhoneTextQueuedOut(entry))) return false;
  }
  return true;
};
