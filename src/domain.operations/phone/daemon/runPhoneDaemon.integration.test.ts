import { promises as fs } from 'fs';
import { type IsoDuration, sleep } from 'iso-time';
import { join } from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import { getAllPhoneMailboxEntries } from '@src/.test/utils/getAllPhoneMailboxEntries';
import { daoPhoneDaemon } from '@src/access/daos/daoPhoneDaemon';
import { daoPhoneMailbox } from '@src/access/daos/daoPhoneMailbox';
import { getOnePhoneCacheDir } from '@src/access/daos/getOnePhoneCacheDir';
import type { RhachetCloneSayRaw } from '@src/access/sdks/sdkRhachetClone';
import { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import type { PhoneContext } from '../PhoneContext';
import { runPhoneDaemon } from './runPhoneDaemon';

const GROVE = 'bert-laptop';
const TREE = 'svc-lessons.beav.feat-book-a-lesson';
const SERIAL_MECHANIC = '20fa7ac9-4dfc-4cbc-be9f-7685b5672a14';
const SERIAL_FOREMAN = '4c1e8b27-9a0f-4d2e-8b31-6f7a0c5d2e19';

// a short poll, and two quiet spans: one the test outlasts, one it never reaches. the short span
// is below the stamps' one-second grain on purpose: it clamps the tick-before-idle order
const TICK_TEST: IsoDuration = { milliseconds: 50 };
const IDLE_SHORT: IsoDuration = { milliseconds: 1 };
const IDLE_LONG: IsoDuration = { minutes: 5 };

/**
 * .what = a temp tree with one QUEUED text from the mechanic to the foreman in its own tree
 */
const genScene = async (input: {
  slug: string;
}): Promise<{ gitRoot: string; treeDir: string }> => {
  const gitRoot = genTempDir({ slug: input.slug });
  const treeDir = join(gitRoot, 'sandpine', '_worktrees', TREE);
  await fs.mkdir(treeDir, { recursive: true });
  await fs.writeFile(join(treeDir, '.git'), 'gitdir: elsewhere\n');
  await daoPhoneMailbox.gen({
    treeDir,
    clone: 'mechanic',
    record: new PhoneTextRecord({
      uuid: '7f3e9a02-41c6-4b0e-9d2a-0c5e8f1a3b77',
      way: 'out',
      group: null,
      re: null,
      from: `phone://grove=${GROVE}/tree=${TREE}/clone=mechanic`,
      to: `phone://grove=${GROVE}/tree=${TREE}/clone=foreman`,
      what: 'where is book-a-lesson?',
      status: 'QUEUED',
      reason: null,
    }),
  });
  return { gitRoot, treeDir };
};

/**
 * .what = a phone context whose clone sdk says every text released
 */
const asContext = (input: { gitRoot: string }): PhoneContext => ({
  gitRoot: input.gitRoot,
  forestDir: join(input.gitRoot, '.git.forest'),
  groveSelf: GROVE,
  sdkClone: {
    getAllClones: async () => [
      { serial: SERIAL_MECHANIC, slug: 'mechanic', reachState: 'LIVE' },
      { serial: SERIAL_FOREMAN, slug: 'foreman', reachState: 'LIVE' },
    ],
    say: async (): Promise<RhachetCloneSayRaw> => ({
      exitCode: 0,
      stdout: JSON.stringify({
        delivered: true,
        verdict: 'released',
        serial: SERIAL_FOREMAN,
      }),
      stderr: '',
    }),
  },
});

/**
 * .what = waits until the mechanic's text leaves QUEUED, or gives up
 */
const awaitSettled = async (input: { treeDir: string }): Promise<string> => {
  for (let attempt = 0; attempt < 50; attempt++) {
    const [entry] = await getAllPhoneMailboxEntries({
      treeDir: input.treeDir,
      clone: 'mechanic',
    });
    if (entry && entry.record.status !== 'QUEUED') return entry.record.status;
    await sleep({ milliseconds: 100 });
  }
  return 'QUEUED';
};

describe('runPhoneDaemon', () => {
  given('[case1] a tree with one QUEUED text', () => {
    when('[t0] the daemon runs, then gets a stop signal', () => {
      const result = useThen('it delivers, then stops', async () => {
        const scene = await genScene({ slug: 'phone-daemon-run-case1' });
        const run = runPhoneDaemon(
          { treeDir: scene.treeDir, tick: TICK_TEST, idleExit: IDLE_LONG },
          asContext({ gitRoot: scene.gitRoot }),
        );
        const status = await awaitSettled({ treeDir: scene.treeDir });
        const lockLive = await daoPhoneDaemon.getOne({
          treeDir: scene.treeDir,
        });

        // a stop signal, as `phone.daemon del` sends it
        process.emit('SIGTERM');
        const { outcome } = await run;
        const lockAfter = await daoPhoneDaemon.getOne({
          treeDir: scene.treeDir,
        });
        return { status, lockLive, outcome, lockAfter };
      });

      then('the text is delivered', () => {
        expect(result.status).toEqual('DELIVERED');
      });

      then('the daemon held the lock while it ran', () => {
        expect(result.lockLive?.state).toEqual('LIVE');
        expect(result.lockLive?.pid).toEqual(process.pid);
      });

      then('it stops on the signal, and releases the lock', () => {
        expect(result.outcome).toEqual('stopped');
        expect(result.lockAfter).toEqual(null);
      });
    });
  });

  given('[case3] a tree whose one text is said, then falls quiet', () => {
    when('[t0] the daemon runs past its idle span', () => {
      const result = useThen('it exits on its own', async () => {
        const scene = await genScene({ slug: 'phone-daemon-run-case3' });
        const { outcome } = await runPhoneDaemon(
          { treeDir: scene.treeDir, tick: TICK_TEST, idleExit: IDLE_SHORT },
          asContext({ gitRoot: scene.gitRoot }),
        );
        const [entry] = await getAllPhoneMailboxEntries({
          treeDir: scene.treeDir,
          clone: 'mechanic',
        });
        const lockAfter = await daoPhoneDaemon.getOne({
          treeDir: scene.treeDir,
        });
        return { outcome, status: entry?.record.status, lockAfter };
      });

      then('the text was said before the daemon rested', () => {
        expect(result.status).toEqual('DELIVERED');
      });

      then('it exits idle, and releases the lock', () => {
        expect(result.outcome).toEqual('idle');
        expect(result.lockAfter).toEqual(null);
      });
    });
  });

  given(
    '[case2] a tree whose mailbox holds a corrupt record beside a good one',
    () => {
      when('[t0] the daemon runs past its idle span', () => {
        const result = useThen('the good text is said', async () => {
          const scene = await genScene({ slug: 'phone-daemon-run-case2' });
          const [entry] = await getAllPhoneMailboxEntries({
            treeDir: scene.treeDir,
            clone: 'mechanic',
          });

          // a second clone's mailbox holds one record no reader can parse
          const corrupt = await daoPhoneMailbox.gen({
            treeDir: scene.treeDir,
            clone: 'foreman',
            record: new PhoneTextRecord({
              ...entry!.record,
              uuid: '0b9d4e17-5a2c-4f3e-8d61-2c7a9e0f4b58',
            }),
          });
          await fs.writeFile(corrupt.path, '{ not json');

          const { outcome } = await runPhoneDaemon(
            { treeDir: scene.treeDir, tick: TICK_TEST, idleExit: IDLE_SHORT },
            asContext({ gitRoot: scene.gitRoot }),
          );
          const after = await daoPhoneMailbox.getOne({ path: entry!.path });
          const log = await fs.readFile(
            daoPhoneDaemon.getOneLogPath({ treeDir: scene.treeDir }),
            'utf8',
          );
          return { outcome, status: after.record.status, log, corrupt };
        });

        then(
          'the readable text is delivered; one bad record halts naught',
          () => {
            expect(result.status).toEqual('DELIVERED');
            expect(result.outcome).toEqual('idle');
          },
        );

        then(
          'the bad record is named in the daemon log, never dropped in silence',
          () => {
            expect(result.log).toContain('record skipped, unreadable');
            expect(result.log).toContain(result.corrupt.path);
          },
        );
      });
    },
  );

  given('[case4] a tree whose mailbox root can not be read', () => {
    when('[t0] the daemon runs', () => {
      const result = useThen('the fault fails loud', async () => {
        const scene = await genScene({ slug: 'phone-daemon-run-case4' });

        // a file where the mailbox root dir should be: an fs fault, not a bad record
        const root = join(
          getOnePhoneCacheDir({ treeDir: scene.treeDir }),
          'skill=phone.text',
        );
        await fs.rm(root, { recursive: true, force: true });
        await fs.writeFile(root, 'not a dir');

        const error = await getError(
          runPhoneDaemon(
            { treeDir: scene.treeDir, tick: TICK_TEST, idleExit: IDLE_LONG },
            asContext({ gitRoot: scene.gitRoot }),
          ),
        );
        const lockAfter = await daoPhoneDaemon.getOne({
          treeDir: scene.treeDir,
        });
        return { error, lockAfter };
      });

      then('the fault is thrown, never swallowed into a log line', () => {
        expect(result.error.message).toMatch(/ENOTDIR/);
      });

      then(
        'the lock is released, so the next send starts a fresh daemon',
        () => {
          expect(result.lockAfter).toEqual(null);
        },
      );
    });
  });
});
