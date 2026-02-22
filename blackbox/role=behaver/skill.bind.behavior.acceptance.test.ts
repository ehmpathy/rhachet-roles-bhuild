import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  genConsumerRepo,
  genBehaviorFixture,
  genTestGitRepo,
  runRhachetSkill,
} from '../.test/infra';

const SCRIPT_PATH = path.join(
  __dirname,
  '../../src/domain.roles/behaver/skills/bind.behavior.sh',
);

/**
 * .what = runs bind.behavior via rhachet dispatch (consumer pattern)
 * .why = tests the skill as a consumer would invoke it
 */
const runBindBehaviorSkillViaRhachet = (input: {
  action: 'get' | 'set' | 'del';
  behaviorName?: string;
  repoDir: string;
}) => {
  let args = input.action;
  if (input.action === 'set' && input.behaviorName) {
    args += ` --behavior "${input.behaviorName}"`;
  }
  return runRhachetSkill({
    repo: 'bhuild',
    skill: 'bind.behavior',
    args,
    repoDir: input.repoDir,
  });
};

/**
 * .what = runs bind.behavior via direct bash spawn
 * .why = tests the shell script directly without rhachet dispatch
 */
const runBindBehaviorSkillDirect = (input: {
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
 * .what = creates a test repo with a behavior directory for direct script tests
 * .why = bind.behavior.sh requires a git repo context with .behavior/
 */
const createTestRepoWithBehavior = (input: {
  branchName: string;
  behaviorName: string;
}): { repoDir: string; cleanup: () => void } => {
  const { repoDir, cleanup } = genTestGitRepo({
    prefix: 'bind-behavior-test-',
    branchName: input.branchName,
  });

  const behaviorDir = path.join(repoDir, '.behavior', input.behaviorName);
  fs.mkdirSync(behaviorDir, { recursive: true });
  fs.writeFileSync(
    path.join(behaviorDir, '0.wish.md'),
    '# wish\n\ntest wish content',
  );

  return { repoDir, cleanup };
};

describe('bind.behavior', () => {
  // ========================================
  // consumer invocation tests (via rhachet)
  // ========================================

  given('[case1] consumer: unbound branch with extant behavior', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'bind-behavior-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'test-feature',
      });
      return consumer;
    });

    when('[t0] get is invoked', () => {
      const result = useBeforeAll(async () =>
        runBindBehaviorSkillViaRhachet({
          action: 'get',
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('outputs "not bound"', () => {
        expect(result.output).toContain('not bound');
      });
    });

    when('[t1] set --behavior test-feature is invoked', () => {
      then('exits with code 0', () => {
        execSync('git checkout -b bind-test-branch', { cwd: scene.repoDir });

        const result = runBindBehaviorSkillViaRhachet({
          action: 'set',
          behaviorName: 'test-feature',
          repoDir: scene.repoDir,
        });

        expect(result.exitCode).toBe(0);
      });

      then('creates bind flag file', () => {
        execSync('git checkout -b bind-flag-test', { cwd: scene.repoDir });

        runBindBehaviorSkillViaRhachet({
          action: 'set',
          behaviorName: 'test-feature',
          repoDir: scene.repoDir,
        });

        const bindDir = path.join(
          scene.repoDir,
          '.behavior',
          'v2025_01_01.test-feature',
          '.bind',
        );
        expect(fs.existsSync(bindDir)).toBe(true);

        const flags = fs.readdirSync(bindDir);
        expect(flags.length).toBeGreaterThan(0);
      });

      then('outputs success message', () => {
        execSync('git checkout -b success-test', { cwd: scene.repoDir });

        const result = runBindBehaviorSkillViaRhachet({
          action: 'set',
          behaviorName: 'test-feature',
          repoDir: scene.repoDir,
        });

        expect(result.output).toContain('bound');
      });
    });
  });

  given('[case2] consumer: bound branch', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'bind-behavior-bound-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'bound-feature',
      });

      execSync('git checkout -b already-bound', { cwd: consumer.repoDir });
      runBindBehaviorSkillViaRhachet({
        action: 'set',
        behaviorName: 'bound-feature',
        repoDir: consumer.repoDir,
      });
      return consumer;
    });

    when('[t0] get is invoked', () => {
      const result = useBeforeAll(async () =>
        runBindBehaviorSkillViaRhachet({
          action: 'get',
          repoDir: scene.repoDir,
        }),
      );

      then('outputs the bound behavior name', () => {
        expect(result.output).toContain('bound-feature');
      });
    });

    when('[t1] del is invoked', () => {
      const delResult = useBeforeAll(async () =>
        runBindBehaviorSkillViaRhachet({
          action: 'del',
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 0', () => {
        expect(delResult.exitCode).toBe(0);
      });

      then('unbinds the branch', () => {
        const getResult = runBindBehaviorSkillViaRhachet({
          action: 'get',
          repoDir: scene.repoDir,
        });
        expect(getResult.output).toContain('not bound');
      });
    });
  });

  given('[case3] consumer: set with absent behavior', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'bind-behavior-notfound-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'some-feature',
      });
      return consumer;
    });

    when('[t0] skill is invoked with unknown behavior name', () => {
      const result = useBeforeAll(async () =>
        runBindBehaviorSkillViaRhachet({
          action: 'set',
          behaviorName: 'nonexistent',
          repoDir: scene.repoDir,
        }),
      );

      then('exits with non-zero code', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions behavior not found', () => {
        expect(result.output).toContain('no behavior found');
      });
    });
  });

  // ========================================
  // direct invocation tests (via bash spawn)
  // ========================================

  given('[case4] direct: --set creates bind flag in correct location', () => {
    when('[t0] executed with --set --behavior', () => {
      const branchName = 'feature/test-binding';
      const behaviorName = 'v2025_01_01.test-behavior';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepoWithBehavior({ branchName, behaviorName });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('creates .bind directory with flag file', () => {
        const result = runBindBehaviorSkillDirect({
          args: 'set --behavior test-behavior',
          targetDir: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('bound branch');

        const flagPath = path.join(
          testRepo.repoDir,
          '.behavior',
          behaviorName,
          '.bind',
          'feature.test-binding.flag',
        );
        expect(fs.existsSync(flagPath)).toBe(true);

        const flagContent = fs.readFileSync(flagPath, 'utf-8');
        expect(flagContent).toContain('branch: feature/test-binding');
        expect(flagContent).toContain('bound_by: bind.behavior skill');
      });
    });
  });

  given('[case5] direct: --set when already bound to same behavior', () => {
    when('[t0] executed twice with same behavior', () => {
      const branchName = 'feature/idempotent-test';
      const behaviorName = 'v2025_01_01.same-behavior';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepoWithBehavior({ branchName, behaviorName });
        runBindBehaviorSkillDirect({
          args: 'set --behavior same-behavior',
          targetDir: testRepo.repoDir,
        });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('succeeds idempotently', () => {
        const result = runBindBehaviorSkillDirect({
          args: 'set --behavior same-behavior',
          targetDir: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('already bound to');
      });
    });
  });

  given('[case6] direct: --set when bound to different behavior', () => {
    when('[t0] executed with different behavior name', () => {
      const branchName = 'feature/conflict-test';
      const behaviorName = 'v2025_01_01.first-behavior';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepoWithBehavior({ branchName, behaviorName });

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

        runBindBehaviorSkillDirect({
          args: 'set --behavior first-behavior',
          targetDir: testRepo.repoDir,
        });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('fails fast with helpful error', () => {
        const result = runBindBehaviorSkillDirect({
          args: 'set --behavior second-behavior',
          targetDir: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(1);
        expect(result.stdout).toContain('already bound to different behavior');
        expect(result.stdout).toContain('bind.behavior.sh del');
      });
    });
  });

  given('[case7] direct: --del removes bind flag', () => {
    when('[t0] executed after binding', () => {
      const branchName = 'feature/delete-test';
      const behaviorName = 'v2025_01_01.delete-behavior';
      let testRepo: { repoDir: string; cleanup: () => void };
      let flagPath: string;

      beforeAll(() => {
        testRepo = createTestRepoWithBehavior({ branchName, behaviorName });
        flagPath = path.join(
          testRepo.repoDir,
          '.behavior',
          behaviorName,
          '.bind',
          'feature.delete-test.flag',
        );

        runBindBehaviorSkillDirect({
          args: 'set --behavior delete-behavior',
          targetDir: testRepo.repoDir,
        });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('removes the flag file', () => {
        expect(fs.existsSync(flagPath)).toBe(true);

        const result = runBindBehaviorSkillDirect({
          args: 'del',
          targetDir: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('unbound branch');
        expect(fs.existsSync(flagPath)).toBe(false);
      });
    });
  });

  given('[case8] direct: --del when not bound', () => {
    when('[t0] executed on unbound branch', () => {
      const branchName = 'feature/unbound-test';
      const behaviorName = 'v2025_01_01.unbound-behavior';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepoWithBehavior({ branchName, behaviorName });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('succeeds idempotently', () => {
        const result = runBindBehaviorSkillDirect({
          args: 'del',
          targetDir: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('no bind found');
      });
    });
  });

  given('[case9] direct: --get returns bound behavior name', () => {
    when('[t0] executed on bound branch', () => {
      const branchName = 'feature/get-bound-test';
      const behaviorName = 'v2025_01_01.get-behavior';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepoWithBehavior({ branchName, behaviorName });
        runBindBehaviorSkillDirect({
          args: 'set --behavior get-behavior',
          targetDir: testRepo.repoDir,
        });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('returns behavior name', () => {
        const result = runBindBehaviorSkillDirect({
          args: 'get',
          targetDir: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('bound to:');
        expect(result.stdout).toContain('get-behavior');
      });
    });
  });

  given('[case10] direct: --get when not bound', () => {
    when('[t0] executed on unbound branch', () => {
      const branchName = 'feature/get-unbound-test';
      const behaviorName = 'v2025_01_01.get-unbound-behavior';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepoWithBehavior({ branchName, behaviorName });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('returns "not bound"', () => {
        const result = runBindBehaviorSkillDirect({
          args: 'get',
          targetDir: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe('not bound');
      });
    });
  });

  given('[case11] direct: no action flag', () => {
    when('[t0] executed without action', () => {
      const branchName = 'feature/no-action-test';
      const behaviorName = 'v2025_01_01.no-action-behavior';
      let testRepo: { repoDir: string; cleanup: () => void };

      beforeAll(() => {
        testRepo = createTestRepoWithBehavior({ branchName, behaviorName });
      });

      afterAll(() => {
        testRepo.cleanup();
      });

      then('fails fast with usage guidance', () => {
        const result = runBindBehaviorSkillDirect({
          args: '',
          targetDir: testRepo.repoDir,
        });

        expect(result.exitCode).toBe(1);
        expect(result.stdout).toContain('no action specified');
        expect(result.stdout).toContain('usage:');
      });
    });
  });
});
