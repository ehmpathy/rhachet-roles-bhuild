import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { given, then, when } from 'test-fns';

const SCRIPT_PATH = path.join(__dirname, 'init.behavior.sh');

/**
 * .what = creates a temporary git repo for testing init.behavior
 * .why  = init.behavior.sh requires a git repo context
 */
const createTestRepo = (input: {
  branchName: string;
}): { repoDir: string; cleanup: () => void } => {
  // create temp directory
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'init-behavior-test-'));

  // init git repo
  execSync('git init', { cwd: repoDir });
  execSync('git config user.email "test@test.com"', { cwd: repoDir });
  execSync('git config user.name "Test"', { cwd: repoDir });

  // create initial commit (required for branch operations)
  fs.writeFileSync(path.join(repoDir, 'README.md'), '# Test');
  execSync('git add .', { cwd: repoDir });
  execSync('git commit -m "initial"', { cwd: repoDir });

  // create and checkout the test branch
  execSync(`git checkout -b "${input.branchName}"`, { cwd: repoDir });

  return {
    repoDir,
    cleanup: () => fs.rmSync(repoDir, { recursive: true, force: true }),
  };
};

/**
 * .what = runs init.behavior.sh with given args in given directory
 * .why  = centralizes script execution for tests
 */
const runInitBehavior = (input: {
  args: string;
  cwd: string;
}): { stdout: string; exitCode: number } => {
  try {
    const stdout = execSync(`bash "${SCRIPT_PATH}" ${input.args}`, {
      cwd: input.cwd,
      encoding: 'utf-8',
      env: {
        ...process.env,
        PATH: process.env.PATH,
      },
    });
    return { stdout: stdout.trim(), exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; status?: number };
    return {
      stdout: (execError.stdout ?? '').toString().trim(),
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
          cwd: testRepo.repoDir,
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
            cwd: freshRepo.repoDir,
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
          cwd: testRepo.repoDir,
        });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('fails fast with helpful error', () => {
        const result = runInitBehavior({
          args: '--name second-behavior',
          cwd: testRepo.repoDir,
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
          cwd: testRepo.repoDir,
        });
        expect(firstResult.exitCode).toBe(0);

        // second run should fail because branch is now bound
        const secondResult = runInitBehavior({
          args: '--name same-behavior',
          cwd: testRepo.repoDir,
        });
        expect(secondResult.exitCode).toBe(1);
        expect(secondResult.stdout).toContain('already bound to');
      });
    });
  });
});
