import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { bootBehavior } from './boot.behavior';

/**
 * .what = end-to-end integration test for the boot-behavior hook (real git + fs)
 * .why  = locks the ACTUAL hook output — not just discovery — so the yield-path
 *         gap can never reopen. this is the exact surface the wish targets:
 *         a bound branch, `.yield.md` artifacts, and the emitted context blocks.
 *         it also covers every branch-resolution exit path (bound / unbound /
 *         multi-bind / non-git) so their friction contract is snapped.
 */

// flatten a branch name the same way binds do (slashes → dots, specials → _).
// note: must mirror `getBranchBehaviorBind`'s flatten logic — if production
// changes how it flattens, update this in lockstep or binds won't be found here.
const asFlatBranch = (branchName: string): string =>
  branchName
    .replace(/\//g, '.')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_$/, '');

const genBoundBehaviorRepo = (input: {
  branchName: string;
  behaviorName: string;
  files: Record<string, string>;
}): { repoDir: string } => {
  const repoDir = genTempDir({ slug: 'bootBehavior-e2e', git: true });

  // put the repo on the target branch
  execSync(`git checkout -B "${input.branchName}"`, { cwd: repoDir });
  const flatBranch = asFlatBranch(input.branchName);

  // scaffold the behavior dir with a bind flag + artifact files
  const behaviorDir = path.join(repoDir, '.behavior', input.behaviorName);
  fs.mkdirSync(path.join(behaviorDir, '.bind'), { recursive: true });
  fs.writeFileSync(path.join(behaviorDir, '.bind', `${flatBranch}.flag`), '');
  for (const [name, content] of Object.entries(input.files)) {
    fs.writeFileSync(path.join(behaviorDir, name), content);
  }

  return { repoDir };
};

// scaffold a git repo whose branch is bound to MULTIPLE behaviors (a conflict)
const genMultiBindRepo = (input: {
  branchName: string;
  behaviorNames: string[];
}): { repoDir: string } => {
  const repoDir = genTempDir({ slug: 'bootBehavior-e2e', git: true });
  execSync(`git checkout -B "${input.branchName}"`, { cwd: repoDir });
  const flatBranch = asFlatBranch(input.branchName);

  for (const name of input.behaviorNames) {
    const behaviorDir = path.join(repoDir, '.behavior', name);
    fs.mkdirSync(path.join(behaviorDir, '.bind'), { recursive: true });
    fs.writeFileSync(path.join(behaviorDir, '.bind', `${flatBranch}.flag`), '');
    fs.writeFileSync(path.join(behaviorDir, '0.wish.md'), `wish = ${name}`);
  }

  return { repoDir };
};

// join a spy's recorded calls into one text block, one call per line
const asSpyText = (spy: jest.SpyInstance): string =>
  spy.mock.calls
    .map((args) => args.map((a: unknown) => String(a)).join(' '))
    .join('\n');

// sentinel thrown by the mocked process.exit so we can record the code + halt
class BootExit extends Error {
  constructor(public readonly code: number) {
    super(`boot exit ${code}`);
  }
}

// run bootBehavior against a repo; capture stdout + stderr + exit code
const captureBootOutput = (input: {
  repoDir: string;
}): { stdout: string; stderr: string; exitCode: number | null } => {
  const cwdBefore = process.cwd();
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  const errSpy = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  // capture the exit code + halt execution rather than kill the test runner.
  // note: `as never` is required — jest types `process.exit` as `(code) => never`,
  // so a mock that throws cannot satisfy the signature without this cast.
  const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((
    code?: number,
  ) => {
    throw new BootExit(code ?? 0);
  }) as never);

  try {
    process.chdir(input.repoDir);
    const exitCode = ((): number | null => {
      try {
        bootBehavior();
        return null;
      } catch (error) {
        if (!(error instanceof BootExit)) throw error;
        return error.code;
      }
    })();
    return {
      stdout: asSpyText(logSpy),
      stderr: asSpyText(errSpy),
      exitCode,
    };
  } finally {
    process.chdir(cwdBefore);
    logSpy.mockRestore();
    errSpy.mockRestore();
    exitSpy.mockRestore();
  }
};

describe('bootBehavior (integration)', () => {
  given(
    '[case1] a branch bound to a behavior with `.yield.md` artifacts',
    () => {
      const scene = useBeforeAll(async () =>
        genBoundBehaviorRepo({
          branchName: 'feat/boot-behaver-onboots-e2e',
          behaviorName: 'v2026_07_05.boot-e2e',
          files: {
            '0.wish.md': 'wish = boot e2e',
            '1.vision.yield.md': '# vision yield content',
            '2.1.criteria.blackbox.yield.md':
              '# criteria blackbox yield content',
            '2.3.criteria.blueprint.yield.md':
              '# criteria blueprint yield content',
            '3.3.0.blueprint.factory.yield.md':
              '# factory blueprint yield content',
            '3.3.1.blueprint.product.yield.md':
              '# product blueprint yield content',
          },
        }),
      );

      when('[t0] the boot hook runs on that branch', () => {
        const result = useThen(
          'it emits without an unexpected exit',
          async () => captureBootOutput({ repoDir: scene.repoDir }),
        );

        then('it announces the bound behavior', () => {
          expect(result.stdout).toContain(
            'BOUND BEHAVIOR: v2026_07_05.boot-e2e',
          );
        });

        then('it emits the wish block', () => {
          expect(result.stdout).toContain('<behavior scope="wish" path="');
          expect(result.stdout).toContain('0.wish.md');
        });

        then('it emits the vision `.yield.md` block', () => {
          expect(result.stdout).toContain('<behavior scope="vision" path="');
          expect(result.stdout).toContain('1.vision.yield.md');
          expect(result.stdout).toContain('vision yield content');
        });

        then('it emits both criteria `.yield.md` blocks', () => {
          expect(result.stdout).toContain(
            '<behavior scope="criteria-blackbox" path="',
          );
          expect(result.stdout).toContain('2.1.criteria.blackbox.yield.md');
          expect(result.stdout).toContain(
            '<behavior scope="criteria-blueprint" path="',
          );
          expect(result.stdout).toContain('2.3.criteria.blueprint.yield.md');
        });

        then('it emits the factory blueprint `.yield.md` block', () => {
          expect(result.stdout).toContain(
            '<behavior scope="blueprint-factory" path="',
          );
          expect(result.stdout).toContain('3.3.0.blueprint.factory.yield.md');
          expect(result.stdout).toContain('factory blueprint yield content');
        });

        then('it emits the product blueprint `.yield.md` block', () => {
          expect(result.stdout).toContain('<behavior scope="blueprint" path="');
          expect(result.stdout).toContain('3.3.1.blueprint.product.yield.md');
        });

        then(
          'the full stdout matches snapshot (locks the emitted contract)',
          () => {
            expect(result.stdout).toMatchSnapshot();
          },
        );

        then('it emits no stderr warns', () => {
          expect(result.stderr).toEqual('');
        });

        then('it exits cleanly (no forced exit on the happy path)', () => {
          expect(result.exitCode).toBeNull();
        });
      });
    },
  );

  given('[case2] a bound behavior whose required `0.wish.md` is absent', () => {
    const scene = useBeforeAll(async () =>
      genBoundBehaviorRepo({
        branchName: 'feat/boot-nowish-e2e',
        behaviorName: 'v2026_07_05.boot-nowish-e2e',
        files: {
          // wish intentionally absent; only a vision yield is present
          '1.vision.yield.md': '# vision yield content',
        },
      }),
    );

    when('[t0] the boot hook runs on that branch', () => {
      const result = useThen(
        'it emits without an unexpected exit (never blocks session)',
        async () => captureBootOutput({ repoDir: scene.repoDir }),
      );

      then('it never blocks the session (no exit was forced)', () => {
        // the happy path returns without a process.exit, so no code is captured
        expect(result.exitCode).toBeNull();
      });

      then('it warns to stderr that the required wish is not found', () => {
        expect(result.stderr).toContain('required file not found');
        expect(result.stderr).toContain('0.wish.md');
      });

      then('the warn is actionable (tells the human how to fix it)', () => {
        expect(result.stderr).toContain('to fix:');
        expect(result.stderr).toContain('bind.behavior.sh --del');
      });

      then('it still emits the vision block it did find', () => {
        expect(result.stdout).toContain('<behavior scope="vision" path="');
        expect(result.stdout).toContain('1.vision.yield.md');
      });

      then('it does not emit the wish block (the file is absent)', () => {
        expect(result.stdout).not.toContain('scope="wish"');
      });

      then(
        'the stderr warn matches snapshot (locks the error contract)',
        () => {
          expect(result.stderr).toMatchSnapshot();
        },
      );
    });
  });

  given(
    '[case3] a branch bound to MORE THAN ONE behavior (a bind clash)',
    () => {
      const scene = useBeforeAll(async () =>
        genMultiBindRepo({
          branchName: 'feat/boot-multibind-e2e',
          behaviorNames: [
            'v2026_07_05.boot-multibind-a',
            'v2026_07_05.boot-multibind-b',
          ],
        }),
      );

      when('[t0] the boot hook runs on that branch', () => {
        const result = useThen(
          'it emits without an unexpected exit (exits 0, never blocks session)',
          async () => captureBootOutput({ repoDir: scene.repoDir }),
        );

        then('it exits 0 so the session is never blocked', () => {
          expect(result.exitCode).toEqual(0);
        });

        then('it warns about the branch that has the bind clash', () => {
          expect(result.stderr).toContain('feat/boot-multibind-e2e');
          expect(result.stderr).toContain('bind.behavior.sh --del');
        });

        then('it states clearly that no behavior context will load', () => {
          expect(result.stderr).toContain('no behavior context will load');
        });

        then('it loads no behavior context (stdout is empty)', () => {
          expect(result.stdout).toEqual('');
        });

        then(
          'the stderr warn matches snapshot (locks the clash contract)',
          () => {
            expect(result.stderr).toMatchSnapshot();
          },
        );
      });
    },
  );

  given('[case4] a git branch with no behavior bound to it', () => {
    const scene = useBeforeAll(async () => {
      const repoDir = genTempDir({ slug: 'bootBehavior-e2e', git: true });
      execSync('git checkout -B feat/boot-unbound-e2e', { cwd: repoDir });
      return { repoDir };
    });

    when('[t0] the boot hook runs on that branch', () => {
      const result = useThen('it emits without an unexpected exit', async () =>
        captureBootOutput({ repoDir: scene.repoDir }),
      );

      then('it exits 0 (an unbound branch is a valid no-op)', () => {
        expect(result.exitCode).toEqual(0);
      });

      then('it emits no context and no stderr', () => {
        expect(result.stdout).toEqual('');
        expect(result.stderr).toEqual('');
      });
    });
  });

  given('[case5] a directory that is not a git repository', () => {
    const scene = useBeforeAll(async () => {
      const repoDir = genTempDir({ slug: 'bootBehavior-e2e-nogit' });
      return { repoDir };
    });

    when('[t0] the boot hook runs from that directory', () => {
      const result = useThen('it emits without an unexpected exit', async () =>
        captureBootOutput({ repoDir: scene.repoDir }),
      );

      then('it exits 0 (outside a repo there is no behavior to boot)', () => {
        expect(result.exitCode).toEqual(0);
      });

      then('it emits no context and no stderr', () => {
        expect(result.stdout).toEqual('');
        expect(result.stderr).toEqual('');
      });
    });
  });
});
