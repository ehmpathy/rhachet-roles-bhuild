import { promises as fs } from 'fs';
import {
  type IsoDuration,
  now,
  toMilliseconds,
  toMillisecondsSinceEpoch,
} from 'iso-time';
import { join } from 'path';

import { asErrorCode } from '@src/infra/errors/asErrorCode';
import { delFileIfUnchanged } from '@src/infra/fs/delFileIfUnchanged';
import { genFileExclusive } from '@src/infra/fs/genFileExclusive';
import { isPidAlive } from '@src/infra/process/isPidAlive';

import { genPhoneCacheDir } from '../genPhoneCacheDir';
import { getOnePhoneCacheDir } from '../getOnePhoneCacheDir';

/**
 * .what = the daemon's lock, as read off disk
 * .why = one daemon per tree; the lock file holds its pid. a lock whose pid is dead is stale,
 *        and the next daemon may reclaim it
 */
export interface PhoneDaemonLock {
  path: string;
  pid: number | null;
  state: 'LIVE' | 'STALE';
}

/**
 * .what = how long a lock with no pid yet still reads LIVE
 * .why = a daemon creates its lock, then writes its pid; this window covers that gap
 */
const LOCK_YOUNG: IsoDuration = { seconds: 10 };

/**
 * .what = the record and delivery protocol this daemon speaks
 * .why = each tree runs its own installed rhachet-roles-bhuild, so a daemon started before an
 *        upgrade outlives it. the lock names the protocol, so the release that next changes it can
 *        find an older daemon and replace it
 */
const PHONE_DAEMON_PROTOCOL = 1;

/**
 * .what = the daemon's dir in a tree: its lock and its log, never a text
 */
const getDaemonDir = (input: { treeDir: string }): string =>
  join(getOnePhoneCacheDir(input), 'skill=phone.daemon');

/**
 * .what = the path of the daemon's log
 */
const getOneLogPath = (input: { treeDir: string }): string =>
  join(getDaemonDir(input), 'daemon.log');

/**
 * .what = reads the daemon's lock; null when no lock exists
 * .note = a lock file just created may hold no pid yet; a young empty lock reads LIVE
 */
const getOne = async (input: {
  treeDir: string;
}): Promise<PhoneDaemonLock | null> => {
  const path = join(getDaemonDir(input), 'daemon.lock');
  const found = await Promise.all([
    fs.readFile(path, 'utf8'),
    fs.stat(path),
  ]).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (!found) return null;
  const [text, stat] = found;
  // the pid is the first token alone; a line a newer writer adds after it never reads as stale
  const pidToken = /^(\d+)(\s|$)/.exec(text)?.[1];
  const pid = pidToken ? Number(pidToken) : null;
  if (pid === null)
    return {
      path,
      pid,
      state:
        toMillisecondsSinceEpoch(now()) - stat.mtimeMs <
        toMilliseconds(LOCK_YOUNG)
          ? 'LIVE'
          : 'STALE',
    };
  return { path, pid, state: isPidAlive({ pid }) ? 'LIVE' : 'STALE' };
};

/**
 * .what = claims the lock for this process; returns false when a live daemon holds it
 * .why = an exclusive create means two daemons that start at once can not both win. a stale lock
 *        is removed only if it still holds the bytes read (`delFileIfUnchanged`), so a reclaimer
 *        that lost the race never removes the winner's fresh lock
 */
const gen = async (input: {
  treeDir: string;
  pid: number;
}): Promise<boolean> => {
  await genPhoneCacheDir(input);
  await fs.mkdir(getDaemonDir(input), { recursive: true });
  const path = join(getDaemonDir(input), 'daemon.lock');

  // a live lock keeps its holder
  const lock = await getOne(input);
  if (lock?.state === 'LIVE') return false;

  // reclaim a stale lock: remove it only if it is still the one read
  if (lock?.state === 'STALE') {
    const bytesStale = await fs
      .readFile(path, 'utf8')
      .catch((error: unknown) => {
        if (asErrorCode({ error }) === 'ENOENT') return null;
        throw error;
      });
    const isStaleLost =
      bytesStale !== null &&
      !(await delFileIfUnchanged({ path, bytesExpected: bytesStale }));
    if (isStaleLost) return false;
  }

  // claim it by an exclusive create; a lock already gone is simply free. the second line names
  // the protocol the daemon speaks, so a later release can tell an older daemon apart
  return genFileExclusive({
    path,
    bytes: `${input.pid}\nprotocol: ${PHONE_DAEMON_PROTOCOL}\n`,
  });
};

/**
 * .what = releases the lock, only if this pid holds it
 */
const del = async (input: {
  treeDir: string;
  pid: number | null;
}): Promise<void> => {
  const lock = await getOne(input);
  if (!lock) return;
  if (input.pid !== null && lock.pid !== input.pid) return;
  await fs.rm(lock.path, { force: true });
};

/**
 * .what = appends one line to the daemon's log
 */
const setLogLine = async (input: {
  treeDir: string;
  line: string;
}): Promise<void> => {
  await fs.mkdir(getDaemonDir(input), { recursive: true });
  await fs.appendFile(getOneLogPath(input), `${input.line}\n`);
};

export const daoPhoneDaemon = { getOne, gen, del, setLogLine, getOneLogPath };
