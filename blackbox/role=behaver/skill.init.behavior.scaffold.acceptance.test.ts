import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genConsumerRepo } from '../.test/infra';

import {
  asSnapshotStable,
  runInitBehaviorSkillDirect,
  shim,
} from './.test/skill.init.behavior.utils';

describe('init.behavior.scaffold', () => {
  given('[case3] direct: unbound branch', () => {
    when('[t0] init.behavior executed', () => {
      const scene = useBeforeAll(async () =>
        genConsumerRepo({ branchName: 'feature/new-behavior-test' }),
      );

      then('creates behavior directory with all scaffold files', () => {
        const result = runInitBehaviorSkillDirect({
          args: '--name test-behavior',
          repoDir: scene.repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain(shim('🦫 oh, behave!'));

        // snapshot for vibe-check
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();

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
          repoDir: repoDir,
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
          repoDir: repoDir,
        });
        return { repoDir };
      });

      then('fails fast with helpful error', () => {
        const result = runInitBehaviorSkillDirect({
          args: '--name second-behavior',
          repoDir: scene.repoDir,
        });

        expect(result.exitCode).toBe(1);
        expect(result.stdout).toContain('already bound to');
        expect(result.stdout).toContain('tree');

        // snapshot for vibe-check
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
