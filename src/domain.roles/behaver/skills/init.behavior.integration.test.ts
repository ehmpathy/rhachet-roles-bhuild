import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { given, then, when } from 'test-fns';

import { genTestGitRepo } from '../../../../accept.blackbox/.test/infra';

const SCRIPT_PATH = path.join(__dirname, 'init.behavior.sh');

/**
 * .what = creates a temporary git repo for testing init.behavior
 * .why  = init.behavior.sh requires a git repo context
 */
const createTestRepo = (input: { branchName: string }) =>
  genTestGitRepo({
    prefix: 'init-behavior-test-',
    branchName: input.branchName,
  });

/**
 * .what = runs init.behavior.sh with given args targeting a specific directory
 * .why  = runs from source dir (where package is resolvable) with --dir flag
 */
const runInitBehavior = (input: {
  args: string;
  targetDir: string;
}): { stdout: string; exitCode: number } => {
  try {
    const stdout = execSync(
      `bash "${SCRIPT_PATH}" ${input.args} --dir "${input.targetDir}"`,
      {
        encoding: 'utf-8',
        env: {
          ...process.env,
          PATH: process.env.PATH,
        },
      },
    );
    return { stdout: stdout.trim(), exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as {
      stdout?: string;
      stderr?: string;
      status?: number;
    };
    // combine stdout and stderr for error checking
    const output = [
      (execError.stdout ?? '').toString().trim(),
      (execError.stderr ?? '').toString().trim(),
    ]
      .filter(Boolean)
      .join('\n');
    return {
      stdout: output,
      exitCode: execError.status ?? 1,
    };
  }
};

describe('init.behavior.sh', () => {
  given('[case1] unbound branch', () => {
    when('[t0] init.behavior executed', () => {
      const branchName = 'feature/new-behavior-test';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepo({ branchName });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('creates behavior directory with all scaffold files', () => {
        const result = runInitBehavior({
          args: '--name test-behavior',
          targetDir: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('behavior thoughtroute initialized');

        // verify behavior directory exists
        const behaviorRoot = path.join(testRepo.repoDir, '.behavior');
        expect(fs.existsSync(behaviorRoot)).toBe(true);

        // find the created behavior directory
        const behaviorDirs = fs.readdirSync(behaviorRoot);
        expect(behaviorDirs.length).toBe(1);
        expect(behaviorDirs[0]).toContain('test-behavior');

        const behaviorDir = path.join(behaviorRoot, behaviorDirs[0]!);

        // verify scaffold files
        expect(fs.existsSync(path.join(behaviorDir, '0.wish.md'))).toBe(true);
        expect(fs.existsSync(path.join(behaviorDir, '1.vision.md'))).toBe(true);
        expect(
          fs.existsSync(path.join(behaviorDir, '2.criteria.blackbox.md')),
        ).toBe(true);
        expect(
          fs.existsSync(path.join(behaviorDir, '2.criteria.blueprint.md')),
        ).toBe(true);
      });

      then('auto-binds current branch to created behavior', () => {
        // run again to trigger the behavior (first run already happened in previous then)
        // but we can check the result from a fresh run
        const freshRepo = createTestRepo({ branchName: 'feature/auto-bind' });

        try {
          const result = runInitBehavior({
            args: '--name auto-bind-test',
            targetDir: freshRepo.repoDir,
          });

          expect(result.exitCode).toBe(0);
          expect(result.stdout).toContain('bound to:');

          // verify bind flag exists
          const behaviorRoot = path.join(freshRepo.repoDir, '.behavior');
          const behaviorDirs = fs.readdirSync(behaviorRoot);
          const behaviorDir = path.join(behaviorRoot, behaviorDirs[0]!);
          const bindDir = path.join(behaviorDir, '.bind');

          expect(fs.existsSync(bindDir)).toBe(true);

          const flagFiles = fs.readdirSync(bindDir);
          expect(flagFiles.length).toBe(1);
          expect(flagFiles[0]).toContain('feature.auto-bind.flag');

          // verify flag content
          const flagContent = fs.readFileSync(
            path.join(bindDir, flagFiles[0]!),
            'utf-8',
          );
          expect(flagContent).toContain('branch: feature/auto-bind');
          expect(flagContent).toContain('bound_by: init.behavior skill');
        } finally {
          freshRepo.cleanup();
        }
      });
    });
  });

  given('[case2] branch already bound to a behavior', () => {
    when('[t0] init.behavior executed', () => {
      const branchName = 'feature/already-bound-test';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepo({ branchName });

        // first, create a behavior and bind the branch
        runInitBehavior({
          args: '--name first-behavior',
          targetDir: testRepo.repoDir,
        });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('fails fast with helpful error', () => {
        const result = runInitBehavior({
          args: '--name second-behavior',
          targetDir: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(1);
        expect(result.stdout).toContain('already bound to');
        expect(result.stdout).toContain('worktree');
      });
    });
  });

  given('[case3] idempotent rerun on same behavior', () => {
    when('[t0] init.behavior executed twice with same name', () => {
      const branchName = 'feature/idempotent-init-test';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepo({ branchName });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('second run fails fast due to binding', () => {
        // first run creates the behavior
        const firstResult = runInitBehavior({
          args: '--name same-behavior',
          targetDir: testRepo.repoDir,
        });
        expect(firstResult.exitCode).toBe(0);

        // second run should fail because branch is now bound
        const secondResult = runInitBehavior({
          args: '--name same-behavior',
          targetDir: testRepo.repoDir,
        });
        expect(secondResult.exitCode).toBe(1);
        expect(secondResult.stdout).toContain('already bound to');
      });
    });
  });
});
