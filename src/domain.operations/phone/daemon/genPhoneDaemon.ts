import { type IsoDuration, sleep } from 'iso-time';

import {
  daoPhoneDaemon,
  type PhoneDaemonLock,
} from '@src/access/daos/daoPhoneDaemon';
import { genPhoneCacheDir } from '@src/access/daos/genPhoneCacheDir';
import { genProcessDetached } from '@src/infra/process/genProcessDetached';

import { getOnePollCount } from './getOnePollCount';

/**
 * .what = how long a start waits to see the new daemon's lock, and how often it looks
 * .why = the daemon is a fresh node process that loads the whole package before it claims the
 *        lock; on a loaded grove that takes seconds, and a wait shorter than it reports a daemon
 *        that did start as one that did not (measured 2026-10-23: >3s at moderate load, >10s at
 *        a load average of ~90). the wait ends the moment the lock shows, so a long bound costs
 *        naught where the start is fast, and is paid in full only where no daemon came up
 */
const START_WAIT: IsoDuration = { seconds: 30 };
const START_POLL: IsoDuration = { milliseconds: 150 };

/**
 * .what = finds this tree's live daemon, or starts one detached
 * .why = `phone.text set` returns at once; the daemon carries the text. a second start beside a
 *        live daemon is a no-op, and two starts at once leave one daemon, since the daemon itself
 *        claims the lock and a loser exits
 *
 * .note = the outcome names what was observed, never what was hoped:
 *         - FOUND       = a live daemon already held the lock
 *         - STARTED     = a daemon was spawned, and its lock was seen LIVE
 *         - UNCONFIRMED = a daemon was spawned, and no LIVE lock showed within the wait
 */
export const genPhoneDaemon = async (input: {
  treeDir: string;
  spawn: { program: string; args: string[] };
}): Promise<{
  lock: PhoneDaemonLock | null;
  outcome: 'FOUND' | 'STARTED' | 'UNCONFIRMED';
}> => {
  // a live daemon already serves this tree
  const { treeDir } = input;
  const lockBefore = await daoPhoneDaemon.getOne({ treeDir });
  if (lockBefore?.state === 'LIVE')
    return { lock: lockBefore, outcome: 'FOUND' };

  // start one, detached, with its output in its own log; the caller names the program
  await genPhoneCacheDir({ treeDir });
  await daoPhoneDaemon.setLogLine({ treeDir, line: '-- start requested' });
  genProcessDetached({
    program: input.spawn.program,
    args: input.spawn.args,
    logPath: daoPhoneDaemon.getOneLogPath({ treeDir }),
    // the daemon serves every clone in the tree, so it carries no one clone's serial
    env: { ...process.env, RHACHET_CLONE_SERIAL: '' },
  });

  // wait for the daemon to claim its lock, so the caller can name its pid
  const polls = getOnePollCount({ wait: START_WAIT, poll: START_POLL });
  for (let attempt = 0; attempt < polls; attempt++) {
    const lock = await daoPhoneDaemon.getOne({ treeDir });
    if (lock?.state === 'LIVE' && lock.pid !== null)
      return { lock, outcome: 'STARTED' };
    await sleep(START_POLL);
  }
  return {
    lock: await daoPhoneDaemon.getOne({ treeDir }),
    outcome: 'UNCONFIRMED',
  };
};
