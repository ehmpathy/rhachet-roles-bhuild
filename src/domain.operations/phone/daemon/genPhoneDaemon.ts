import { sleep } from 'iso-time';

import {
  daoPhoneDaemon,
  type PhoneDaemonLock,
} from '@src/access/daos/daoPhoneDaemon';
import { genPhoneCacheDir } from '@src/access/daos/genPhoneCacheDir';
import { genProcessDetached } from '@src/infra/process/genProcessDetached';

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

  // wait a moment for the daemon to claim its lock, so the caller can name its pid
  for (let attempt = 0; attempt < 20; attempt++) {
    const lock = await daoPhoneDaemon.getOne({ treeDir });
    if (lock?.state === 'LIVE' && lock.pid !== null)
      return { lock, outcome: 'STARTED' };
    await sleep({ milliseconds: 150 });
  }
  return {
    lock: await daoPhoneDaemon.getOne({ treeDir }),
    outcome: 'UNCONFIRMED',
  };
};
