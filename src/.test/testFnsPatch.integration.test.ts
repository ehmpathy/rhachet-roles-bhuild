/**
 * .what = clamps on the two test-fns 1.15.7 defects this repo patches
 *         (patches/test-fns@1.15.7.patch) until test-fns ships the fixes
 *
 * .why  = both broke a temp repo mid-setup under load, far from their cause:
 *         - initGitRepo ran `git init` via spawnSync and never read its status,
 *           so a failed init was swallowed and `git add .` failed instead
 *         - pruneStale judged a dir stale by the date in its name; a test that
 *           fakes the clock forges that name, so a peer jest worker deleted a
 *           live temp repo mid-setup ("this operation must be run in a work tree")
 *
 * .note = each failure is injected in a child node process: jest gives each test
 *         file its own copy of process.env and its own Date, so a PATH or a clock
 *         set here never reaches what test-fns does in this process
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

/**
 * .what = run one node code snippet that calls test-fns; return its exit and streams
 * .why = the child holds the real env and the real Date, so the injection lands
 */
const runTestFnsInChild = (input: { code: string; path: string }) => {
  const result = spawnSync('node', ['-e', input.code], {
    env: { ...process.env, PATH: input.path },
    timeout: 60_000,
  });
  return {
    status: result.status,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
};

/**
 * .what = a PATH with a git shim first that refuses `git init` alone
 * .why = the one failure under test: init fails, every other git call works
 */
const genPathWithGitInitRefused = (): string => {
  const gitReal = execFileSync('which', ['git']).toString().trim();
  const shimDir = genTempDir({ slug: 'git-init-refused-shim' });
  const shimPath = join(shimDir, 'git');
  writeFileSync(
    shimPath,
    [
      '#!/usr/bin/env bash',
      'if [ "$1" = "init" ]; then echo "shim: git init refused" >&2; exit 1; fi',
      `exec "${gitReal}" "$@"`,
      '',
    ].join('\n'),
  );
  chmodSync(shimPath, 0o755);
  return `${shimDir}:${process.env.PATH ?? ''}`;
};

const CODE_GIT_TEMP_DIR =
  "process.stdout.write(require('test-fns').genTempDir({ slug: 'git-init-probe', git: true }))";

// a clock forged to a day far past the prune window, then a temp dir named by it
const CODE_FORGED_TEMP_DIR = [
  "const DateReal = Date; const forged = '2026-01-01T00:00:00.000Z';",
  'globalThis.Date = class extends DateReal {',
  '  constructor(...a) { if (a.length) super(...a); else super(forged); }',
  '  static now() { return new DateReal(forged).getTime(); }',
  '};',
  "process.stdout.write(require('test-fns').genTempDir({ slug: 'forged-clock-probe' }));",
].join('\n');

// a plain temp dir; the first one in a process triggers the prune
const CODE_PLAIN_TEMP_DIR =
  "process.stdout.write(require('test-fns').genTempDir({ slug: 'prune-trigger' }))";

describe('test-fns patch', () => {
  given('[case1] `git init` fails in genTempDir({ git: true })', () => {
    when('[t0] a temp repo is requested', () => {
      const result = useThen('the child exits', async () =>
        runTestFnsInChild({
          code: CODE_GIT_TEMP_DIR,
          path: genPathWithGitInitRefused(),
        }),
      );

      then('🔴 it fails, never returns a dir that is no repo', () => {
        expect(result.status).not.toEqual(0);
        expect(result.stdout).toEqual('');
      });

      then('🔴 the error names the init and its stderr', () => {
        expect(result.stderr).toContain('initGitRepo: git init failed');
        expect(result.stderr).toContain('shim: git init refused');
      });
    });
  });

  given('[case2] `git init` succeeds in genTempDir({ git: true })', () => {
    when('[t0] a temp repo is requested', () => {
      const result = useThen('the child exits', async () =>
        runTestFnsInChild({
          code: CODE_GIT_TEMP_DIR,
          path: process.env.PATH ?? '',
        }),
      );

      then('it returns a dir that is a git work tree', () => {
        expect(result.status).toEqual(0);
        const inside = execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
          cwd: result.stdout,
        })
          .toString()
          .trim();
        expect(inside).toEqual('true');
      });
    });
  });

  given('[case3] a live temp dir whose name a faked clock forged as stale', () => {
    when('[t0] a peer process starts and its first genTempDir prunes', () => {
      const result = useThen('both children exit', async () => {
        const forged = runTestFnsInChild({
          code: CODE_FORGED_TEMP_DIR,
          path: process.env.PATH ?? '',
        });
        const peer = runTestFnsInChild({
          code: CODE_PLAIN_TEMP_DIR,
          path: process.env.PATH ?? '',
        });
        return { forged, peer, forgedAfterPrune: existsSync(forged.stdout) };
      });

      then('the forged dir was named stale', () => {
        expect(result.forged.status).toEqual(0);
        expect(result.forged.stdout).toContain(
          '2026-01-01T00-00-00.000Z.forged-clock-probe',
        );
        expect(result.peer.status).toEqual(0);
      });

      then('🔴 the prune spares it, since the fs saw it touched just now', () => {
        expect(result.forgedAfterPrune).toEqual(true);
      });
    });
  });
});
