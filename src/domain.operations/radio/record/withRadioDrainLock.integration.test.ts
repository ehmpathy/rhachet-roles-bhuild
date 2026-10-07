import { spawn } from 'child_process';
import * as fs from 'fs';
import { sleep } from 'iso-time';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

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

    when('[t0] the drain fails, then another drain starts', () => {
      const result = useThen('the error surfaces', async () => {
        const drainFailed = withRadioDrainLock(
          async (_input: Record<string, never>, _context: { cwd: string }) => {
            throw new Error('upstream exploded');
          },
        );
        const failure = await drainFailed({}, { cwd: scene.cwd }).then(
          () => ({ message: null }),
          (error: Error) => ({ message: error.message }),
        );
        const startedAt = Date.now();
        const next = await scene.drain({ name: 'next' }, { cwd: scene.cwd });
        return { failure, next, waitedMs: Date.now() - startedAt };
      });

      then('the error is not swallowed', () => {
        expect(result.failure.message).toEqual('upstream exploded');
      });

      then('the lock is released, so the next drain runs at once', () => {
        expect(result.next.name).toEqual('next');
        expect(result.waitedMs).toBeLessThan(5_000);
      });
    });
  });
});
