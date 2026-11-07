import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { daoPhoneDaemon } from '@src/access/daos/daoPhoneDaemon';
import { getOnePhoneCacheDir } from '@src/access/daos/getOnePhoneCacheDir';
import { isPidAlive } from '@src/infra/process/isPidAlive';

import { delPhoneDaemon } from './delPhoneDaemon';

/**
 * .what = writes a daemon lock that names the given pid
 * .why = the stop path reads only the lock and the pid; a real daemon is not needed to reach it
 */
const setLockOfPid = async (input: { treeDir: string; pid: number }) => {
  const dir = join(getOnePhoneCacheDir(input), 'skill=phone.daemon');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(join(dir, 'daemon.lock'), `${input.pid}\n`);
};

describe('delPhoneDaemon', () => {
  given('[case1] a tree with no daemon lock', () => {
    when('[t0] the daemon is stopped', () => {
      const result = useThen('it settles at once', async () => {
        const treeDir = genTempDir({ slug: 'phone-daemon-del-case1' });
        return delPhoneDaemon({ treeDir });
      });

      then('the outcome is ABSENT, with no lock before', () => {
        expect(result.outcome).toEqual('ABSENT');
        expect(result.lockBefore).toEqual(null);
      });
    });
  });

  given('[case2] a lock whose pid is already gone', () => {
    when('[t0] the daemon is stopped', () => {
      const result = useThen('the stale lock is released', async () => {
        const treeDir = genTempDir({ slug: 'phone-daemon-del-case2' });
        const child = spawn(process.execPath, ['-e', '0']);
        await new Promise((done) => child.on('exit', done));
        await setLockOfPid({ treeDir, pid: child.pid! });
        const outcome = await delPhoneDaemon({ treeDir });
        const lockAfter = await daoPhoneDaemon.getOne({ treeDir });
        return { ...outcome, lockAfter };
      });

      then('the outcome is STOPPED, and the lock is gone', () => {
        expect(result.outcome).toEqual('STOPPED');
        expect(result.lockBefore?.state).toEqual('STALE');
        expect(result.lockAfter).toEqual(null);
      });
    });
  });

  given('[case3] a live daemon that does not exit within the wait', () => {
    when('[t0] the daemon is stopped', () => {
      const result = useThen(
        'it keeps the lock and reads STOPPING',
        async () => {
          const treeDir = genTempDir({ slug: 'phone-daemon-del-case3' });

          // a stand-in for a daemon mid-say: it ignores the stop signal
          const child = spawn(process.execPath, [
            '-e',
            "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000); process.stdout.write('ready')",
          ]);
          await new Promise((done) => child.stdout.once('data', done));
          await setLockOfPid({ treeDir, pid: child.pid! });

          const outcome = await delPhoneDaemon({ treeDir });
          const lockAfter = await daoPhoneDaemon.getOne({ treeDir });
          const isAliveAfter = isPidAlive({ pid: child.pid! });
          child.kill('SIGKILL');
          return { ...outcome, lockAfter, isAliveAfter };
        },
      );

      then('the outcome is STOPPING', () => {
        expect(result.outcome).toEqual('STOPPING');
      });

      then('the lock stays, so no second daemon can start beside it', () => {
        expect(result.isAliveAfter).toEqual(true);
        expect(result.lockAfter?.state).toEqual('LIVE');
      });
    });
  });
});
