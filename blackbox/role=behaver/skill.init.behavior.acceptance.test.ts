import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  genConsumerRepo,
  genTestGitRepo,
  runRhachetSkill,
  type ConsumerRepo,
} from '../.test/infra';

const SCRIPT_PATH = path.join(
  __dirname,
  '../../src/domain.roles/behaver/skills/init.behavior.sh',
);

/**
 * .what = runs init.behavior via rhachet dispatch (consumer pattern)
 * .why = tests the skill as a consumer would invoke it
 */
const runInitBehaviorSkillViaRhachet = (input: {
  behaviorName: string;
  repoDir: string;
}) =>
  runRhachetSkill({
    repo: 'bhuild',
    skill: 'init.behavior',
    args: `--name "${input.behaviorName}"`,
    repoDir: input.repoDir,
  });

/**
 * .what = runs init.behavior via direct bash spawn
 * .why = tests the shell script directly without rhachet dispatch
 */
const runInitBehaviorSkillDirect = (input: {
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

/**
 * .what = creates a temporary git repo for testing init.behavior
 * .why = init.behavior.sh requires a git repo context
 */
const createTestRepo = (input: { branchName: string }) =>
  genTestGitRepo({
    prefix: 'init-behavior-test-',
    branchName: input.branchName,
  });

describe('init.behavior', () => {
  // ========================================
  // consumer invocation tests (via rhachet)
  // ========================================

  given('[case1] consumer: fresh consumer repo on main branch', () => {
    let consumer: ConsumerRepo;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'init-behavior-test-' });
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] init.behavior --name test-feature is invoked', () => {
      then('rejects bind to main branch', () => {
        const result = runInitBehaviorSkillViaRhachet({
          behaviorName: 'test-feature',
          repoDir: consumer.repoDir,
        });

        expect(result.exitCode).toBe(1);
        expect(result.output).toContain('can not bind');
        expect(result.output).toContain('main');
      });

      then('creates behavior directory with scaffold files', () => {
        execSync('git checkout -b scaffold-test-branch', {
          cwd: consumer.repoDir,
        });

        runInitBehaviorSkillViaRhachet({
          behaviorName: 'scaffold-test',
          repoDir: consumer.repoDir,
        });

        const behaviorRoot = path.join(consumer.repoDir, '.behavior');
        expect(fs.existsSync(behaviorRoot)).toBe(true);

        const behaviorDirs = fs.readdirSync(behaviorRoot);
        const scaffoldDir = behaviorDirs.find((d) =>
          d.includes('scaffold-test'),
        );
        expect(scaffoldDir).toBeDefined();

        const behaviorPath = path.join(behaviorRoot, scaffoldDir!);
        expect(fs.existsSync(path.join(behaviorPath, '0.wish.md'))).toBe(true);
        expect(fs.existsSync(path.join(behaviorPath, '1.vision.md'))).toBe(
          true,
        );
        expect(
          fs.existsSync(path.join(behaviorPath, '2.criteria.blackbox.md')),
        ).toBe(true);
        expect(
          fs.existsSync(path.join(behaviorPath, '3.3.blueprint.v1.src')),
        ).toBe(true);
      });

      then('auto-binds current branch to the behavior', () => {
        execSync('git checkout -b auto-bind-test', { cwd: consumer.repoDir });

        runInitBehaviorSkillViaRhachet({
          behaviorName: 'auto-bind-test',
          repoDir: consumer.repoDir,
        });

        const behaviorRoot = path.join(consumer.repoDir, '.behavior');
        const behaviorDirs = fs.readdirSync(behaviorRoot);
        const autoBindDir = behaviorDirs.find((d) =>
          d.includes('auto-bind-test'),
        );
        expect(autoBindDir).toBeDefined();

        const bindDir = path.join(behaviorRoot, autoBindDir!, '.bind');
        expect(fs.existsSync(bindDir)).toBe(true);

        const bindFlags = fs.readdirSync(bindDir);
        expect(bindFlags.length).toBeGreaterThan(0);
      });

      then('outputs success message', () => {
        execSync('git checkout -b output-test', { cwd: consumer.repoDir });

        const result = runInitBehaviorSkillViaRhachet({
          behaviorName: 'output-test',
          repoDir: consumer.repoDir,
        });

        expect(result.output).toContain('behavior thoughtroute initialized');
      });
    });
  });

  given('[case2] consumer: branch already bound to a behavior', () => {
    let consumer: ConsumerRepo;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'init-behavior-bound-test-' });
      execSync('git checkout -b already-bound-branch', {
        cwd: consumer.repoDir,
      });
      runInitBehaviorSkillViaRhachet({
        behaviorName: 'first-behavior',
        repoDir: consumer.repoDir,
      });
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] init.behavior --name second-behavior is invoked', () => {
      const result = useBeforeAll(async () =>
        runInitBehaviorSkillViaRhachet({
          behaviorName: 'second-behavior',
          repoDir: consumer.repoDir,
        }),
      );

      then('exits with non-zero code', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions branch is already bound', () => {
        expect(result.output).toContain('already bound');
      });
    });
  });

  // ========================================
  // direct invocation tests (via bash spawn)
  // ========================================

  given('[case3] direct: unbound branch', () => {
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
        const result = runInitBehaviorSkillDirect({
          args: '--name test-behavior',
          targetDir: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('behavior thoughtroute initialized');

        const behaviorRoot = path.join(testRepo.repoDir, '.behavior');
        expect(fs.existsSync(behaviorRoot)).toBe(true);

        const behaviorDirs = fs.readdirSync(behaviorRoot);
        expect(behaviorDirs.length).toBe(1);
        expect(behaviorDirs[0]).toContain('test-behavior');

        const behaviorDir = path.join(behaviorRoot, behaviorDirs[0]!);

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
        const freshRepo = createTestRepo({ branchName: 'feature/auto-bind' });

        try {
          const result = runInitBehaviorSkillDirect({
            args: '--name auto-bind-test',
            targetDir: freshRepo.repoDir,
          });

          expect(result.exitCode).toBe(0);
          expect(result.stdout).toContain('bound to:');

          const behaviorRoot = path.join(freshRepo.repoDir, '.behavior');
          const behaviorDirs = fs.readdirSync(behaviorRoot);
          const behaviorDir = path.join(behaviorRoot, behaviorDirs[0]!);
          const bindDir = path.join(behaviorDir, '.bind');

          expect(fs.existsSync(bindDir)).toBe(true);

          const flagFiles = fs.readdirSync(bindDir);
          expect(flagFiles.length).toBe(1);
          expect(flagFiles[0]).toContain('feature.auto-bind.flag');

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

  given('[case4] direct: branch already bound to a behavior', () => {
    when('[t0] init.behavior executed', () => {
      const branchName = 'feature/already-bound-test';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepo({ branchName });

        runInitBehaviorSkillDirect({
          args: '--name first-behavior',
          targetDir: testRepo.repoDir,
        });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('fails fast with helpful error', () => {
        const result = runInitBehaviorSkillDirect({
          args: '--name second-behavior',
          targetDir: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(1);
        expect(result.stdout).toContain('already bound to');
        expect(result.stdout).toContain('tree');
      });
    });
  });

  given('[case5] direct: idempotent rerun on same behavior', () => {
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
        const firstResult = runInitBehaviorSkillDirect({
          args: '--name same-behavior',
          targetDir: testRepo.repoDir,
        });
        expect(firstResult.exitCode).toBe(0);

        const secondResult = runInitBehaviorSkillDirect({
          args: '--name same-behavior',
          targetDir: testRepo.repoDir,
        });
        expect(secondResult.exitCode).toBe(1);
        expect(secondResult.stdout).toContain('already bound to');
      });
    });
  });
});
