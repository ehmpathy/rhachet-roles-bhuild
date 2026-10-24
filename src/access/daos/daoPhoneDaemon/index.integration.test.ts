import { promises as fs } from 'fs';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { daoPhoneDaemon } from './index';

/**
 * .what = a pid no live process holds
 * .why = a stale lock is one whose pid is gone; the max pid on linux is far below this
 */
const PID_GONE = 2_147_483_000;

describe('daoPhoneDaemon', () => {
  given('[case1] a tree with no daemon', () => {
    when('[t0] two daemons claim the lock', () => {
      const result = useThen('only the first wins', async () => {
        const treeDir = genTempDir({ slug: 'dao-phone-daemon-case1' });
        const first = await daoPhoneDaemon.gen({ treeDir, pid: process.pid });
        const second = await daoPhoneDaemon.gen({
          treeDir,
          pid: process.pid + 1,
        });
        const lock = await daoPhoneDaemon.getOne({ treeDir });
        return { first, second, lock };
      });

      then('the first claims it', () => {
        expect(result.first).toEqual(true);
      });

      then('the second leaves it to the first', () => {
        expect(result.second).toEqual(false);
      });

      then('the lock names the first pid, LIVE', () => {
        expect(result.lock).toMatchObject({ pid: process.pid, state: 'LIVE' });
      });
    });
  });

  given(
    '[case1b] a lock a newer writer wrote, with a line after its pid',
    () => {
      when('[t0] the lock is read', () => {
        const result = useThen('it reads by its pid alone', async () => {
          const treeDir = genTempDir({ slug: 'dao-phone-daemon-case1b' });
          await daoPhoneDaemon.gen({ treeDir, pid: process.pid });
          const lock = await daoPhoneDaemon.getOne({ treeDir });
          await fs.writeFile(
            lock!.path,
            `${process.ppid}\nprotocol: 9\nfuture: field\n`,
          );
          const lockNewer = await daoPhoneDaemon.getOne({ treeDir });
          return { lockNewer };
        });

        then(
          'a live holder reads LIVE, never STALE, so no second daemon starts',
          () => {
            expect(result.lockNewer).toMatchObject({
              pid: process.ppid,
              state: 'LIVE',
            });
          },
        );
      });
    },
  );

  given('[case1c] a lock this daemon writes', () => {
    when('[t0] its bytes are read', () => {
      const result = useThen('they name the pid and the protocol', async () => {
        const treeDir = genTempDir({ slug: 'dao-phone-daemon-case1c' });
        await daoPhoneDaemon.gen({ treeDir, pid: process.pid });
        const lock = await daoPhoneDaemon.getOne({ treeDir });
        return { bytes: await fs.readFile(lock!.path, 'utf8') };
      });

      then(
        'the second line names the protocol, so a later release can tell it apart',
        () => {
          expect(result.bytes).toEqual(`${process.pid}\nprotocol: 1\n`);
        },
      );
    });
  });

  given('[case2] a lock held by a pid that is gone', () => {
    when('[t0] a new daemon claims the lock', () => {
      const result = useThen('the stale lock is reclaimed', async () => {
        const treeDir = genTempDir({ slug: 'dao-phone-daemon-case2' });
        await daoPhoneDaemon.gen({ treeDir, pid: PID_GONE });
        const before = await daoPhoneDaemon.getOne({ treeDir });
        const claimed = await daoPhoneDaemon.gen({ treeDir, pid: process.pid });
        const after = await daoPhoneDaemon.getOne({ treeDir });
        return { before, claimed, after };
      });

      then('the old lock reads STALE', () => {
        expect(result.before?.state).toEqual('STALE');
      });

      then('the new daemon claims it', () => {
        expect(result.claimed).toEqual(true);
        expect(result.after).toMatchObject({ pid: process.pid, state: 'LIVE' });
      });
    });
  });

  given('[case3] a lock held by this pid', () => {
    when('[t0] another pid tries to release it, then this pid does', () => {
      const result = useThen('only the holder releases it', async () => {
        const treeDir = genTempDir({ slug: 'dao-phone-daemon-case3' });
        await daoPhoneDaemon.gen({ treeDir, pid: process.pid });
        await daoPhoneDaemon.del({ treeDir, pid: process.pid + 1 });
        const afterOther = await daoPhoneDaemon.getOne({ treeDir });
        await daoPhoneDaemon.del({ treeDir, pid: process.pid });
        const afterSelf = await daoPhoneDaemon.getOne({ treeDir });
        const ignore = await fs.readFile(
          `${treeDir}/.agent/.cache/repo=bhuild/role=dispatcher/.gitignore`,
          'utf8',
        );
        return { afterOther, afterSelf, ignore };
      });

      then('another pid can not release it', () => {
        expect(result.afterOther?.pid).toEqual(process.pid);
      });

      then('the holder releases it', () => {
        expect(result.afterSelf).toBeNull();
      });

      then('the lock lives under a self-ignored cache', () => {
        expect(result.ignore).toEqual('*\n');
      });
    });
  });
});
