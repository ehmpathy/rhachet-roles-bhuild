import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genConsumerRepo } from '../.test/infra';

import {
  runInitBehaviorSkillViaRhachet,
  shim,
} from './.test/skill.init.behavior.utils';

describe('init.behavior.consumer', () => {
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
});
