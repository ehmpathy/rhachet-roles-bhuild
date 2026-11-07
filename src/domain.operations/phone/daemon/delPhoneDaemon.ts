import { type IsoDuration, sleep } from 'iso-time';

import {
  daoPhoneDaemon,
  type PhoneDaemonLock,
} from '@src/access/daos/daoPhoneDaemon';
import { isPidAlive } from '@src/infra/process/isPidAlive';
import { setProcessSignal } from '@src/infra/process/setProcessSignal';

import { getOnePollCount } from './getOnePollCount';

const EXIT_POLL: IsoDuration = { milliseconds: 200 };
const EXIT_WAIT: IsoDuration = { seconds: 10 };

/**
 * .what = stops this tree's daemon; a no-op when none runs
 * .why = a human may stop delivery; no text is lost, since the file is the queue and the next
 *        `phone.text set` (or `phone.daemon set`) starts a daemon that picks up where this left
 *
 * .note = the lock is released only once the daemon's pid is gone. a daemon mid-say finishes that
 *         say before it reads the stop, and to free its lock sooner would let a second daemon
 *         start beside it and say the same texts. so a daemon still alive after the wait keeps
 *         its lock, releases it itself on exit, and the outcome reads STOPPING
 */
export const delPhoneDaemon = async (input: {
  treeDir: string;
}): Promise<{
  lockBefore: PhoneDaemonLock | null;
  outcome: 'ABSENT' | 'STOPPED' | 'STOPPING';
}> => {
  const lockBefore = await daoPhoneDaemon.getOne(input);
  if (!lockBefore) return { lockBefore, outcome: 'ABSENT' };

  // signal a live daemon to stop at its next loop turn; a pid already gone leaves a stale lock,
  // released below
  if (lockBefore.state === 'LIVE' && lockBefore.pid !== null)
    setProcessSignal({ pid: lockBefore.pid, signal: 'SIGTERM' });

  // wait for the pid to exit; a daemon still mid-say keeps its lock
  const isExited = await isPidExitedWithin({
    pid: lockBefore.pid,
    wait: EXIT_WAIT,
  });
  if (!isExited) return { lockBefore, outcome: 'STOPPING' };

  // the daemon released its own lock on exit; this release covers a crash
  await daoPhoneDaemon.del({ treeDir: input.treeDir, pid: lockBefore.pid });
  return { lockBefore, outcome: 'STOPPED' };
};

/**
 * .what = waits up to a bound for a pid to exit; true once it is gone, or when no pid is known
 */
const isPidExitedWithin = async (input: {
  pid: number | null;
  wait: IsoDuration;
}): Promise<boolean> => {
  if (input.pid === null) return true;
  const polls = getOnePollCount({ wait: input.wait, poll: EXIT_POLL });
  for (let poll = 0; poll < polls; poll++) {
    if (!isPidAlive({ pid: input.pid })) return true;
    await sleep(EXIT_POLL);
  }
  return !isPidAlive({ pid: input.pid });
};
