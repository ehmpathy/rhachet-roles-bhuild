import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { given, then, when } from 'test-fns';

const SCRIPT_PATH = path.join(__dirname, 'bind.behavior.sh');
const REPO_ROOT = path.join(__dirname, '../../..');

/**
 * .what = creates a temporary git repo with a behavior directory for testing
 * .why  = bind.behavior.sh requires a git repo context with .behavior/
 */
const createTestRepo = (input: {
  branchName: string;
  behaviorName: string;
}): { repoDir: string; cleanup: () => void } => {
  // create temp directory
  const repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bind-behavior-test-'));

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

  // create behavior directory structure
  const behaviorDir = path.join(repoDir, '.behavior', input.behaviorName);
  fs.mkdirSync(behaviorDir, { recursive: true });
  fs.writeFileSync(
    path.join(behaviorDir, '0.wish.md'),
    '# wish\n\ntest wish content',
  );

  return {
    repoDir,
    cleanup: () => fs.rmSync(repoDir, { recursive: true, force: true }),
  };
};

/**
 * .what = runs bind.behavior.sh with given args in given directory
 * .why  = centralizes script execution for tests
 */
const runBindBehavior = (input: {
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

describe('bind.behavior.sh', () => {
  given('[case1] --set creates bind flag in correct location', () => {
    when('[t0] executed with --set --behavior', () => {
      const branchName = 'feature/test-binding';
      const behaviorName = 'v2025_01_01.test-behavior';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepo({ branchName, behaviorName });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('creates .bind directory with flag file', () => {
        const result = runBindBehavior({
          args: '--set --behavior test-behavior',
          cwd: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('bound branch');

        // verify flag file exists
        const flagPath = path.join(
          testRepo.repoDir,
          '.behavior',
          behaviorName,
          '.bind',
          'feature.test-binding.flag',
        );
        expect(fs.existsSync(flagPath)).toBe(true);

        // verify flag content
        const flagContent = fs.readFileSync(flagPath, 'utf-8');
        expect(flagContent).toContain('branch: feature/test-binding');
        expect(flagContent).toContain('bound_by: bind.behavior skill');
      });
    });
  });

  given('[case2] --set when already bound to same behavior', () => {
    when('[t0] executed twice with same behavior', () => {
      const branchName = 'feature/idempotent-test';
      const behaviorName = 'v2025_01_01.same-behavior';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepo({ branchName, behaviorName });
        // first bind
        runBindBehavior({
          args: '--set --behavior same-behavior',
          cwd: testRepo.repoDir,
        });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('succeeds idempotently', () => {
        const result = runBindBehavior({
          args: '--set --behavior same-behavior',
          cwd: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('already bound to');
      });
    });
  });

  given('[case3] --set when bound to different behavior', () => {
    when('[t0] executed with different behavior name', () => {
      const branchName = 'feature/conflict-test';
      const behaviorName = 'v2025_01_01.first-behavior';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepo({ branchName, behaviorName });

        // create second behavior
        const secondBehaviorDir = path.join(
          testRepo.repoDir,
          '.behavior',
          'v2025_01_01.second-behavior',
        );
        fs.mkdirSync(secondBehaviorDir, { recursive: true });
        fs.writeFileSync(
          path.join(secondBehaviorDir, '0.wish.md'),
          '# wish\n\nsecond behavior',
        );

        // bind to first behavior
        runBindBehavior({
          args: '--set --behavior first-behavior',
          cwd: testRepo.repoDir,
        });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('fails fast with helpful error', () => {
        const result = runBindBehavior({
          args: '--set --behavior second-behavior',
          cwd: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(1);
        expect(result.stdout).toContain('already bound to different behavior');
        expect(result.stdout).toContain('--del');
      });
    });
  });

  given('[case4] --del removes bind flag', () => {
    when('[t0] executed after binding', () => {
      const branchName = 'feature/delete-test';
      const behaviorName = 'v2025_01_01.delete-behavior';
      let testRepo: { repoDir: string; cleanup: () => void };
      let flagPath: string;

      beforeAll(() => {
        testRepo = createTestRepo({ branchName, behaviorName });
        flagPath = path.join(
          testRepo.repoDir,
          '.behavior',
          behaviorName,
          '.bind',
          'feature.delete-test.flag',
        );

        // bind first
        runBindBehavior({
          args: '--set --behavior delete-behavior',
          cwd: testRepo.repoDir,
        });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('removes the flag file', () => {
        // verify flag exists before delete
        expect(fs.existsSync(flagPath)).toBe(true);

        const result = runBindBehavior({
          args: '--del',
          cwd: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('unbound branch');
        expect(fs.existsSync(flagPath)).toBe(false);
      });
    });
  });

  given('[case5] --del when not bound', () => {
    when('[t0] executed on unbound branch', () => {
      const branchName = 'feature/unbound-test';
      const behaviorName = 'v2025_01_01.unbound-behavior';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepo({ branchName, behaviorName });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('succeeds idempotently', () => {
        const result = runBindBehavior({
          args: '--del',
          cwd: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('no binding existed');
      });
    });
  });

  given('[case6] --get returns bound behavior name', () => {
    when('[t0] executed on bound branch', () => {
      const branchName = 'feature/get-bound-test';
      const behaviorName = 'v2025_01_01.get-behavior';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepo({ branchName, behaviorName });
        runBindBehavior({
          args: '--set --behavior get-behavior',
          cwd: testRepo.repoDir,
        });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('returns behavior name', () => {
        const result = runBindBehavior({
          args: '--get',
          cwd: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('bound to:');
        expect(result.stdout).toContain('get-behavior');
      });
    });
  });

  given('[case7] --get when not bound', () => {
    when('[t0] executed on unbound branch', () => {
      const branchName = 'feature/get-unbound-test';
      const behaviorName = 'v2025_01_01.get-unbound-behavior';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepo({ branchName, behaviorName });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('returns "not bound"', () => {
        const result = runBindBehavior({
          args: '--get',
          cwd: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('not bound');
      });
    });
  });

  given('[case8] no action flag', () => {
    when('[t0] executed without action', () => {
      const branchName = 'feature/no-action-test';
      const behaviorName = 'v2025_01_01.no-action-behavior';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepo({ branchName, behaviorName });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('fails fast with usage guidance', () => {
        const result = runBindBehavior({
          args: '',
          cwd: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(1);
        expect(result.stdout).toContain('no action specified');
        expect(result.stdout).toContain('usage:');
      });
    });
  });
});
