import { execSync } from 'child_process';
import {
  detectTerminalChoice,
  transformMessageForTerminal,
} from 'emoji-space-shim';
import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genConsumerRepo, runRhachetSkill } from '../.test/infra';

/**
 * .what = shim a string with emoji space adjustments
 * .why = ensures test assertions match output regardless of terminal env
 */
const shim = (message: string) =>
  transformMessageForTerminal({ message, terminal: detectTerminalChoice() });

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


describe('init.behavior', () => {
  // ========================================
  // consumer invocation tests (via rhachet)
  // ========================================

  given('[case1] consumer: fresh consumer repo on main branch', () => {
    const scene = useBeforeAll(async () =>
      genConsumerRepo({ prefix: 'init-behavior-test' }),
    );

    when('[t0] init.behavior --name test-feature is invoked', () => {
      then('rejects bind to main branch', () => {
        const result = runInitBehaviorSkillViaRhachet({
          behaviorName: 'test-feature',
          repoDir: scene.repoDir,
        });

        expect(result.exitCode).toBe(1);
        expect(result.output).toContain('can not bind');
        expect(result.output).toContain('main');
      });

      then('creates behavior directory with scaffold files', () => {
        execSync('git checkout -b scaffold-test-branch', {
          cwd: scene.repoDir,
        });

        runInitBehaviorSkillViaRhachet({
          behaviorName: 'scaffold-test',
          repoDir: scene.repoDir,
        });

        const behaviorRoot = path.join(scene.repoDir, '.behavior');
        expect(fs.existsSync(behaviorRoot)).toBe(true);

        const behaviorDirs = fs.readdirSync(behaviorRoot);
        const scaffoldDir = behaviorDirs.find((d) =>
          d.includes('scaffold-test'),
        );
        expect(scaffoldDir).toBeDefined();

        const behaviorPath = path.join(behaviorRoot, scaffoldDir!);
        expect(fs.existsSync(path.join(behaviorPath, '0.wish.md'))).toBe(true);
        expect(fs.existsSync(path.join(behaviorPath, '1.vision.stone'))).toBe(
          true,
        );
        expect(
          fs.existsSync(path.join(behaviorPath, '2.1.criteria.blackbox.stone')),
        ).toBe(true);
        expect(
          fs.existsSync(path.join(behaviorPath, '3.3.blueprint.v1.stone')),
        ).toBe(true);
        // verify guard files
        expect(fs.existsSync(path.join(behaviorPath, '1.vision.guard'))).toBe(
          true,
        );
        expect(
          fs.existsSync(path.join(behaviorPath, '3.3.blueprint.v1.guard')),
        ).toBe(true);
      });

      then('auto-binds current branch to the behavior', () => {
        execSync('git checkout -b auto-bind-test', { cwd: scene.repoDir });

        runInitBehaviorSkillViaRhachet({
          behaviorName: 'auto-bind-test',
          repoDir: scene.repoDir,
        });

        const behaviorRoot = path.join(scene.repoDir, '.behavior');
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
        execSync('git checkout -b output-test', { cwd: scene.repoDir });

        const result = runInitBehaviorSkillViaRhachet({
          behaviorName: 'output-test',
          repoDir: scene.repoDir,
        });

        expect(result.output).toContain(shim('🦫 oh, behave!'));
      });
    });
  });

  given('[case2] consumer: branch already bound to a behavior', () => {
    const scene = useBeforeAll(async () => {
      const { repoDir } = genConsumerRepo({
        prefix: 'init-behavior-bound-test',
        branchName: 'already-bound-branch',
      });
      runInitBehaviorSkillViaRhachet({
        behaviorName: 'first-behavior',
        repoDir,
      });
      return { repoDir };
    });

    when('[t0] init.behavior --name second-behavior is invoked', () => {
      const result = useBeforeAll(async () =>
        runInitBehaviorSkillViaRhachet({
          behaviorName: 'second-behavior',
          repoDir: scene.repoDir,
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
      const scene = useBeforeAll(async () =>
        genConsumerRepo({ branchName: 'feature/new-behavior-test' }),
      );

      then('creates behavior directory with all scaffold files', () => {
        const result = runInitBehaviorSkillDirect({
          args: '--name test-behavior',
          targetDir: scene.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain(shim('🦫 oh, behave!'));

        const behaviorRoot = path.join(scene.repoDir, '.behavior');
        expect(fs.existsSync(behaviorRoot)).toBe(true);

        const behaviorDirs = fs.readdirSync(behaviorRoot);
        expect(behaviorDirs.length).toBe(1);
        expect(behaviorDirs[0]).toContain('test-behavior');

        const behaviorDir = path.join(behaviorRoot, behaviorDirs[0]!);

        expect(fs.existsSync(path.join(behaviorDir, '0.wish.md'))).toBe(true);
        expect(fs.existsSync(path.join(behaviorDir, '1.vision.stone'))).toBe(
          true,
        );
        expect(
          fs.existsSync(path.join(behaviorDir, '2.1.criteria.blackbox.stone')),
        ).toBe(true);
        expect(
          fs.existsSync(path.join(behaviorDir, '2.3.criteria.blueprint.stone')),
        ).toBe(true);
        // verify guard files
        expect(fs.existsSync(path.join(behaviorDir, '1.vision.guard'))).toBe(
          true,
        );
        expect(
          fs.existsSync(path.join(behaviorDir, '3.3.blueprint.v1.guard')),
        ).toBe(true);
      });

      then('auto-binds current branch to created behavior', () => {
        const { repoDir } = genConsumerRepo({
          branchName: 'feature/auto-bind',
        });

        const result = runInitBehaviorSkillDirect({
          args: '--name auto-bind-test',
          targetDir: repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain(`🍄 we'll remember,`);
        expect(result.stdout).toContain('feature/auto-bind <-> behavior');
        expect(result.stdout).toContain('to boot via hooks');

        const behaviorRoot = path.join(repoDir, '.behavior');
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
      });
    });
  });

  given('[case4] direct: branch already bound to a behavior', () => {
    when('[t0] init.behavior executed', () => {
      const scene = useBeforeAll(async () => {
        const { repoDir } = genConsumerRepo({
          branchName: 'feature/already-bound-test',
        });
        runInitBehaviorSkillDirect({
          args: '--name first-behavior',
          targetDir: repoDir,
        });
        return { repoDir };
      });

      then('fails fast with helpful error', () => {
        const result = runInitBehaviorSkillDirect({
          args: '--name second-behavior',
          targetDir: scene.repoDir,
        });

        expect(result.exitCode).toBe(1);
        expect(result.stdout).toContain('already bound to');
        expect(result.stdout).toContain('tree');
      });
    });
  });

  given('[case5] direct: idempotent rerun on same behavior', () => {
    when('[t0] init.behavior executed twice with same name', () => {
      const scene = useBeforeAll(async () =>
        genConsumerRepo({ branchName: 'feature/idempotent-init-test' }),
      );

      then('second run succeeds (idempotent)', () => {
        const firstResult = runInitBehaviorSkillDirect({
          args: '--name same-behavior',
          targetDir: scene.repoDir,
        });
        expect(firstResult.exitCode).toBe(0);
        expect(firstResult.stdout).toContain('+ 0.wish.md');

        const secondResult = runInitBehaviorSkillDirect({
          args: '--name same-behavior',
          targetDir: scene.repoDir,
        });
        expect(secondResult.exitCode).toBe(0);
        expect(secondResult.stdout).toContain('✓ 0.wish.md');
      });
    });
  });

  given('[case6] direct: --open flag with cat command', () => {
    when('[t0] init.behavior executed with --open cat', () => {
      const scene = useBeforeAll(async () =>
        genConsumerRepo({ branchName: 'feature/open-cat-test' }),
      );

      then('cat command outputs wish file content', () => {
        const result = runInitBehaviorSkillDirect({
          args: '--name open-test --open cat',
          targetDir: scene.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('wish =');
      });

      then('footer shows "opened in cat"', () => {
        const { repoDir } = genConsumerRepo({
          branchName: 'feature/opened-in-test',
        });

        const result = runInitBehaviorSkillDirect({
          args: '--name opened-in-test --open cat',
          targetDir: repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('opened in cat');
      });

      then('output contains footer with relative wish path', () => {
        const { repoDir } = genConsumerRepo({
          branchName: 'feature/footer-test',
        });

        const result = runInitBehaviorSkillDirect({
          args: '--name footer-test',
          targetDir: repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('🌲 go on then,');
        expect(result.stdout).toContain('0.wish.md');
      });
    });
  });

  given('[case7] direct: --open flag with unavailable command', () => {
    when('[t0] init.behavior executed with --open nonexistent-xyz', () => {
      const scene = useBeforeAll(async () =>
        genConsumerRepo({ branchName: 'feature/open-fail-test' }),
      );

      then('behavior files are still created', () => {
        const result = runInitBehaviorSkillDirect({
          args: '--name open-fail-test --open nonexistent-xyz-12345',
          targetDir: scene.repoDir,
        });

        // init should still succeed even if opener fails
        const behaviorRoot = path.join(scene.repoDir, '.behavior');
        expect(fs.existsSync(behaviorRoot)).toBe(true);

        const behaviorDirs = fs.readdirSync(behaviorRoot);
        const openFailDir = behaviorDirs.find((d) =>
          d.includes('open-fail-test'),
        );
        expect(openFailDir).toBeDefined();

        expect(
          fs.existsSync(path.join(behaviorRoot, openFailDir!, '0.wish.md')),
        ).toBe(true);
      });

      then('warn is shown about opener unavailable', () => {
        const { repoDir } = genConsumerRepo({
          branchName: 'feature/warn-test',
        });

        const result = runInitBehaviorSkillDirect({
          args: '--name warn-test --open nonexistent-xyz-12345',
          targetDir: repoDir,
        });

        expect(result.stdout).toContain('unavailable');
      });
    });
  });

  given('[case8] direct: route bind output', () => {
    when('[t0] init.behavior executed', () => {
      const scene = useBeforeAll(async () =>
        genConsumerRepo({ branchName: 'feature/route-bind-test' }),
      );

      then('output shows behavior bind line', () => {
        const result = runInitBehaviorSkillDirect({
          args: '--name route-test',
          targetDir: scene.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('branch bound to behavior');
        expect(result.stdout).toContain('to boot via hooks');
      });

      then('output shows route bind line', () => {
        const { repoDir } = genConsumerRepo({
          branchName: 'feature/route-output-test',
        });

        const result = runInitBehaviorSkillDirect({
          args: '--name route-output-test',
          targetDir: repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('branch bound to route');
        expect(result.stdout).toContain('to drive via hooks');
      });
    });
  });

  given('[case9] direct: idempotent reruns preserve both binds', () => {
    when('[t0] init.behavior executed three times on same behavior', () => {
      const scene = useBeforeAll(async () => {
        const consumer = genConsumerRepo({
          branchName: 'feature/idempotent-binds-test',
        });

        // first run creates files and binds
        const first = runInitBehaviorSkillDirect({
          args: '--name idem-test',
          targetDir: consumer.repoDir,
        });

        // find the behavior dir
        const behaviorRoot = path.join(consumer.repoDir, '.behavior');
        const behaviorDirs = fs.readdirSync(behaviorRoot);
        const behaviorDir = path.join(behaviorRoot, behaviorDirs[0]!);

        return { ...consumer, first, behaviorDir };
      });

      then('first run creates files and both binds succeed', () => {
        expect(scene.first.exitCode).toBe(0);
        expect(scene.first.stdout).toContain('+ 0.wish.md');

        // behavior bind succeeded
        expect(scene.first.stdout).toContain('branch bound to behavior');
        const behaviorBindDir = path.join(scene.behaviorDir, '.bind');
        expect(fs.existsSync(behaviorBindDir)).toBe(true);
        const behaviorBindFlags = fs.readdirSync(behaviorBindDir);
        expect(behaviorBindFlags.length).toBe(1);

        // route bind succeeded
        expect(scene.first.stdout).toContain('branch bound to route');
        const routeBindDir = path.join(scene.behaviorDir, '.route');
        expect(fs.existsSync(routeBindDir)).toBe(true);
        const routeBindFlags = fs
          .readdirSync(routeBindDir)
          .filter((f) => f.startsWith('.bind.'));
        expect(routeBindFlags.length).toBe(1);
      });

      then('second and third runs are idempotent', () => {
        const second = runInitBehaviorSkillDirect({
          args: '--name idem-test',
          targetDir: scene.repoDir,
        });
        expect(second.exitCode).toBe(0);
        expect(second.stdout).toContain('✓ 0.wish.md');

        const third = runInitBehaviorSkillDirect({
          args: '--name idem-test',
          targetDir: scene.repoDir,
        });
        expect(third.exitCode).toBe(0);
        expect(third.stdout).toContain('✓ 0.wish.md');
      });

      then('bind files remain consistent after reruns', () => {
        // verify behavior bind unchanged
        const behaviorBindDir = path.join(scene.behaviorDir, '.bind');
        const behaviorBindFlags = fs.readdirSync(behaviorBindDir);
        expect(behaviorBindFlags.length).toBe(1);

        // verify route bind unchanged
        const routeBindDir = path.join(scene.behaviorDir, '.route');
        const routeBindFlags = fs
          .readdirSync(routeBindDir)
          .filter((f) => f.startsWith('.bind.'));
        expect(routeBindFlags.length).toBe(1);
      });
    });
  });
});
