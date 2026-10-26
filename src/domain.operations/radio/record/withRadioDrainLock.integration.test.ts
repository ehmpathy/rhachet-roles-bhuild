import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import { ConstraintError } from 'helpful-errors';
import { sleep } from 'iso-time';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  useThen,
  when,
} from 'test-fns';
import {
  SimpleMutexAcquireTimeoutError,
  SimpleMutexLeaseExpiredError,
} from 'with-simple-mutex';

import { withRadioDrainLock } from './withRadioDrainLock';

/**
 * .what = a drain stand-in that records when it enters and leaves
 * .why = two holders that overlap prove the lock failed; a trace that never overlaps proves it held
 */
const genTracedDrain = () => {
  const trace: string[] = [];
  const drain = withRadioDrainLock(
    async (input: { name: string }, context: { cwd: string }) => {
      trace.push(`enter:${input.name}`);
      await sleep({ milliseconds: 100 });
      trace.push(`leave:${input.name}`);
      return { name: input.name, cwd: context.cwd };
    },
  );
  return { trace, drain };
};

/**
 * .what = a drain whose logic throws once it holds the lock
 */
const genDrainFailed = () =>
  withRadioDrainLock(
    async (_input: Record<string, never>, _context: { cwd: string }) => {
      throw new Error('upstream exploded');
    },
  );

/**
 * .what = a drain that holds the lock for a span, plus a promise that resolves once it has entered
 * .why = a waiter must start only after the holder owns the lock; a sleep cannot prove that, a
 *        signal from inside the lock can
 */
const genHolderSignaled = (input: { holdMs: number }) => {
  const entry: { signal: () => void } = { signal: () => undefined };
  const entered = new Promise<void>((done) => {
    entry.signal = done;
  });
  const holder = withRadioDrainLock(
    async (
      _input: Record<string, never>,
      _context: { cwd: string; onLockWait?: () => void },
    ) => {
      entry.signal();
      await sleep({ milliseconds: input.holdMs });
    },
  );
  return { holder, entered };
};

/**
 * .what = whether a trace of enter/leave marks ever shows two holders at once
 */
const isTraceOverlapFree = (input: { trace: string[] }): boolean =>
  input.trace.every((mark, index) =>
    index % 2 === 0
      ? mark.startsWith('enter:')
      : mark === `leave:${input.trace[index - 1]!.replace('enter:', '')}`,
  );

/**
 * .what = run one traced drain in its own node process
 * .why = concurrent pushes are separate processes, so the lock must hold across them
 */
const runDrainInChildProcess = (input: {
  cwd: string;
  name: string;
  tracePath: string;
}): Promise<number | null> => {
  const program = [
    `const fs = require('fs');`,
    `const { withRadioDrainLock } = require(${JSON.stringify(path.join(__dirname, 'withRadioDrainLock.ts'))});`,
    `const drain = withRadioDrainLock(async (i) => {`,
    `  fs.appendFileSync(${JSON.stringify(input.tracePath)}, 'enter:' + i.name + '\\n');`,
    `  await new Promise((r) => setTimeout(r, 300));`,
    `  fs.appendFileSync(${JSON.stringify(input.tracePath)}, 'leave:' + i.name + '\\n');`,
    `});`,
    `drain({ name: ${JSON.stringify(input.name)} }, { cwd: ${JSON.stringify(input.cwd)} })`,
    `  .catch((error) => { console.error(error); process.exit(1); });`,
  ].join('\n');
  const child = spawn('node', ['-r', 'esbuild-register', '-e', program], {
    stdio: 'inherit',
  });
  return new Promise((done) => child.on('exit', (code) => done(code)));
};

describe('withRadioDrainLock', () => {
  given('[case1] two drains start at once in one process (C19, X2)', () => {
    const scene = useBeforeAll(async () => ({
      cwd: genTempDir({ slug: 'radio-drain-lock-race', git: true }),
      ...genTracedDrain(),
    }));

    when('[t0] both run concurrently', () => {
      const result = useThen('both complete', async () => ({
        outputs: await Promise.all([
          scene.drain({ name: 'a' }, { cwd: scene.cwd }),
          scene.drain({ name: 'b' }, { cwd: scene.cwd }),
        ]),
      }));

      then('each drain returns its own output', () => {
        expect(result.outputs.map(({ name }) => name).sort()).toEqual([
          'a',
          'b',
        ]);
      });

      then(
        'the drains never overlap: each leaves before the other enters',
        () => {
          expect(scene.trace).toHaveLength(4);
          expect(isTraceOverlapFree({ trace: scene.trace })).toEqual(true);
        },
      );
    });
  });

  given('[case2] two drains start at once in two processes (X2)', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'radio-drain-lock-procs', git: true });
      return { cwd, tracePath: path.join(cwd, 'trace.log') };
    });

    when('[t0] both processes run concurrently', () => {
      const result = useThen('both exit', async () => ({
        codes: await Promise.all([
          runDrainInChildProcess({ ...scene, name: 'a' }),
          runDrainInChildProcess({ ...scene, name: 'b' }),
        ]),
      }));

      then('both processes exit clean', () => {
        expect(result.codes).toEqual([0, 0]);
      });

      then('the drains never overlap across processes', () => {
        const trace = fs
          .readFileSync(scene.tracePath, 'utf-8')
          .trim()
          .split('\n');
        expect(trace).toHaveLength(4);
        expect(isTraceOverlapFree({ trace })).toEqual(true);
      });
    });
  });

  given('[case3] a drain whose logic throws', () => {
    const scene = useBeforeAll(async () => ({
      cwd: genTempDir({ slug: 'radio-drain-lock-throw', git: true }),
      ...genTracedDrain(),
    }));

    when('[t0] the drain throws', () => {
      const result = useThen('the error surfaces', async () => ({
        failure: await genDrainFailed()({}, { cwd: scene.cwd }).then(
          () => ({ message: null }),
          (error: Error) => ({ message: error.message }),
        ),
      }));

      then('the error is not swallowed', () => {
        expect(result.failure.message).toEqual('upstream exploded');
      });
    });

    when('[t1] another drain starts after a failed drain', () => {
      const result = useThen('the next drain enters', async () => {
        await getError(genDrainFailed()({}, { cwd: scene.cwd }));
        const next = withRadioDrainLock(
          async (
            _input: Record<string, never>,
            _context: {
              cwd: string;
              lockAcquireTimeout: { milliseconds: number };
            },
          ) => 'entered',
        );
        return {
          entered: await next(
            {},
            { cwd: scene.cwd, lockAcquireTimeout: { milliseconds: 1_000 } },
          ),
        };
      });

      then(
        'the lock is released, so the next drain enters with no wait',
        () => {
          // a held lock would refuse this short acquire bound with a ConstraintError
          expect(result.entered).toEqual('entered');
        },
      );
    });
  });

  given(
    '[case4] a lock file on disk, as a crashed drain leaves it (rule.forbid.timestamps-in-tracked-files)',
    () => {
      const scene = useBeforeAll(async () => ({
        cwd: genTempDir({ slug: 'radio-drain-lock-crash', git: true }),
      }));

      when('[t0] the lock is held, so its file sits on disk', () => {
        const result = useThen('the dir is observed mid-drain', async () => {
          const observe = withRadioDrainLock(
            async (_input: Record<string, never>, context: { cwd: string }) => {
              const dirLocks = path.join(
                context.cwd,
                '.behavior',
                '.radio',
                '.locks',
              );
              return {
                locksOnDisk: fs
                  .readdirSync(dirLocks)
                  .filter((name) => name !== '.gitignore'),
                filesStageable: execSync(
                  'git ls-files --others --exclude-standard',
                  { cwd: context.cwd },
                )
                  .toString('utf-8')
                  .split('\n')
                  .filter((rel) => rel.length > 0),
              };
            },
          );
          return observe({}, { cwd: scene.cwd });
        });

        then('git can stage no file from the lock dir', () => {
          // guard: the lock file must be on disk, else the check grades naught
          expect(result.locksOnDisk.length).toBeGreaterThan(0);
          expect(
            result.filesStageable.filter((rel) => rel.includes('.locks')),
          ).toEqual([]);
        });
      });
    },
  );

  given('[case5] a drain that holds the lock past the acquire bound', () => {
    const scene = useBeforeAll(async () => ({
      cwd: genTempDir({ slug: 'radio-drain-lock-timeout', git: true }),
    }));

    when('[t0] a second drain waits on the held lock and gives up', () => {
      const result = useThen('the wait gives up', async () => {
        const { holder, entered } = genHolderSignaled({ holdMs: 1_500 });
        const waiter = withRadioDrainLock(
          async (
            _input: Record<string, never>,
            _context: {
              cwd: string;
              lockAcquireTimeout: { milliseconds: number };
            },
          ) => 'entered',
        );
        const held = holder({}, { cwd: scene.cwd });
        await entered; // the holder owns the lock before the waiter tries it
        const error = await getError(
          waiter(
            {},
            { cwd: scene.cwd, lockAcquireTimeout: { milliseconds: 300 } },
          ),
        );
        await held;
        return { error };
      });

      then('it fails as a constraint the caller can act on', () => {
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error).not.toBeInstanceOf(SimpleMutexAcquireTimeoutError);
      });

      then('the message names the fix, not the mutex internals', () => {
        expect(result.error.message).toContain('another drain holds the radio');
        expect(result.error.message).toContain('rhx radio.task.queue get');
        expect(result.error.message).not.toContain('acquire.timeout');
      });
    });
  });

  given('[case5.1] a caller blocked on the lock, and one that is not', () => {
    const scene = useBeforeAll(async () => ({
      cwd: genTempDir({ slug: 'radio-drain-lock-wait-notice', git: true }),
    }));

    when('[t0] a second caller waits on a held lock, then enters', () => {
      const result = useThen('both complete', async () => {
        // each caller owns its own notice log; neither reads the other's
        const noticesHolder: string[] = [];
        const noticesWaiter: string[] = [];
        const { holder, entered: holderEntered } = genHolderSignaled({
          holdMs: 2_000,
        });
        const waiter = withRadioDrainLock(
          async (
            _input: Record<string, never>,
            _context: { cwd: string; onLockWait: () => void },
          ) => 'entered',
        );
        const held = holder(
          {},
          { cwd: scene.cwd, onLockWait: () => noticesHolder.push('wait') },
        );
        await holderEntered; // the holder owns the lock before the waiter tries it
        const entered = await waiter(
          {},
          { cwd: scene.cwd, onLockWait: () => noticesWaiter.push('wait') },
        );
        await held;
        return { entered, noticesHolder, noticesWaiter };
      });

      then('the blocked caller says it waits, once', () => {
        expect(result.entered).toEqual('entered');
        expect(result.noticesWaiter).toEqual(['wait']);
      });

      then(
        'the caller that entered at once says naught, though it ran long',
        () => {
          expect(result.noticesHolder).toEqual([]);
        },
      );
    });
  });

  given('[case6] a drain that runs past its lock lease', () => {
    const scene = useBeforeAll(async () => ({
      cwd: genTempDir({ slug: 'radio-drain-lock-lease', git: true }),
    }));

    when('[t0] the drain work outlasts a short lease', () => {
      const result = useThen('the lease expires', async () => {
        const slow = withRadioDrainLock(
          async (
            _input: Record<string, never>,
            _context: { cwd: string; lockLease: { milliseconds: number } },
          ) => sleep({ milliseconds: 1_200 }),
        );
        const error = await getError(
          slow({}, { cwd: scene.cwd, lockLease: { milliseconds: 300 } }),
        );
        return { error };
      });

      then('it fails as a constraint the caller can act on', () => {
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error).not.toBeInstanceOf(SimpleMutexLeaseExpiredError);
      });

      then('the message names the fix: drain again', () => {
        expect(result.error.message).toContain('ran past its lock lease');
        expect(result.error.message).toContain('rhx radio.task.queue drain');
        expect(result.error.message).not.toContain('lease.duration');
      });
    });
  });
});
