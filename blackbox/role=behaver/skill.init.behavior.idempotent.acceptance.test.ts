import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genConsumerRepo } from '../.test/infra';

import {
  asSnapshotStable,
  runInitBehaviorSkillDirect,
} from './.test/skill.init.behavior.utils';

describe('init.behavior.idempotent', () => {
  given('[case5] direct: idempotent rerun on same behavior', () => {
    when('[t0] init.behavior executed twice with same name', () => {
      const scene = useBeforeAll(async () =>
        genConsumerRepo({ branchName: 'feature/idempotent-init-test' }),
      );

      then('second run succeeds (idempotent)', () => {
        const firstResult = runInitBehaviorSkillDirect({
          args: '--name same-behavior',
          repoDir: scene.repoDir,
        });
        expect(firstResult.exitCode).toBe(0);
        expect(firstResult.stdout).toContain('+ 0.wish.md');

        // snapshot first run for vibe-check
        expect(asSnapshotStable(firstResult.stdout)).toMatchSnapshot(
          'first run output',
        );

        const secondResult = runInitBehaviorSkillDirect({
          args: '--name same-behavior',
          repoDir: scene.repoDir,
        });
        expect(secondResult.exitCode).toBe(0);
        expect(secondResult.stdout).toContain('✓ 0.wish.md');

        // snapshot second run for vibe-check (idempotent markers)
        expect(asSnapshotStable(secondResult.stdout)).toMatchSnapshot(
          'second run output (idempotent)',
        );
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
          repoDir: consumer.repoDir,
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

        // snapshot for vibe-check
        expect(asSnapshotStable(scene.first.stdout)).toMatchSnapshot();
      });

      then('second and third runs are idempotent', () => {
        const second = runInitBehaviorSkillDirect({
          args: '--name idem-test',
          repoDir: scene.repoDir,
        });
        expect(second.exitCode).toBe(0);
        expect(second.stdout).toContain('✓ 0.wish.md');

        const third = runInitBehaviorSkillDirect({
          args: '--name idem-test',
          repoDir: scene.repoDir,
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
