import { promises as fs } from 'fs';
import { join } from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { daoPhoneDaemon } from '@src/access/daos/daoPhoneDaemon';
import { getOnePhoneCacheDir } from '@src/access/daos/getOnePhoneCacheDir';

import { genPhoneDaemon } from './genPhoneDaemon';

/**
 * .what = writes a daemon lock that names the given pid
 * .why = the find path reads only the lock and the pid; a real daemon is not needed to reach it
 */
const setLockOfPid = async (input: { treeDir: string; pid: number }) => {
  const dir = join(getOnePhoneCacheDir(input), 'skill=phone.daemon');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(join(dir, 'daemon.lock'), `${input.pid}\n`);
};

describe('genPhoneDaemon', () => {
  given('[case1] a tree with a live daemon lock', () => {
    when('[t0] a daemon is found or started', () => {
      const result = useThen(
        'it finds the live one, and spawns naught',
        async () => {
          const treeDir = genTempDir({ slug: 'phone-daemon-gen-case1' });
          await setLockOfPid({ treeDir, pid: process.pid });
          return genPhoneDaemon({
            treeDir,
            spawn: {
              program: process.execPath,
              args: ['-e', 'process.exit(1)'],
            },
          });
        },
      );

      then('the outcome is FOUND, with the live lock', () => {
        expect(result.outcome).toEqual('FOUND');
        expect(result.lock?.state).toEqual('LIVE');
        expect(result.lock?.pid).toEqual(process.pid);
      });
    });
  });

  given(
    '[case2] a tree with no daemon, and a spawn that exits before it claims the lock',
    () => {
      when('[t0] a daemon is found or started', () => {
        const result = useThen(
          'it waits out the start, then names it unconfirmed',
          async () => {
            const treeDir = genTempDir({ slug: 'phone-daemon-gen-case2' });
            const outcome = await genPhoneDaemon({
              treeDir,
              spawn: {
                program: process.execPath,
                args: ['-e', 'process.exit(1)'],
              },
            });
            const log = await fs.readFile(
              daoPhoneDaemon.getOneLogPath({ treeDir }),
              'utf8',
            );
            return { ...outcome, log };
          },
        );

        then('the outcome is UNCONFIRMED, with no lock', () => {
          expect(result.outcome).toEqual('UNCONFIRMED');
          expect(result.lock).toEqual(null);
        });

        then('the log records the start request', () => {
          expect(result.log).toContain('-- start requested');
        });
      });
    },
  );
});
