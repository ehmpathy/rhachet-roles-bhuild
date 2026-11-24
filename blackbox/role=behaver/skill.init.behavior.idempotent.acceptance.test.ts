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

  given('[case6] direct: reuses extant behavior with different date prefix', () => {
    when('[t0] behavior exists with earlier date, init called with same name', () => {
      const scene = useBeforeAll(async () => {
        const consumer = genConsumerRepo({
          branchName: 'feature/reuse-date-test',
        });

        // create a behavior directory with an earlier date manually
        const earlierDateBehaviorName = 'v2025_01_01.reuse-date-feature';
        const behaviorDir = path.join(
          consumer.repoDir,
          '.behavior',
          earlierDateBehaviorName,
        );
        fs.mkdirSync(behaviorDir, { recursive: true });
        fs.writeFileSync(
          path.join(behaviorDir, '0.wish.md'),
          '# wish\n\noriginal wish from earlier date',
        );

        return { ...consumer, earlierDateBehaviorName, behaviorDir };
      });

      then('reuses the extant behavior directory', () => {
        // run init.behavior with the same name (but current date would be different)
        const result = runInitBehaviorSkillDirect({
          args: '--name reuse-date-feature',
          repoDir: scene.repoDir,
        });

        expect(result.exitCode).toBe(0);

        // should show the earlier date behavior, not create a new one
        expect(result.stdout).toContain('v2025_01_01.reuse-date-feature');

        // should show files as already present (kept), not created
        expect(result.stdout).toContain('✓ 0.wish.md');
      });

      then('does not create a new behavior directory with today date', () => {
        const behaviorRoot = path.join(scene.repoDir, '.behavior');
        const behaviorDirs = fs.readdirSync(behaviorRoot);

        // only the original behavior directory should exist
        expect(behaviorDirs.length).toBe(1);
        expect(behaviorDirs[0]).toBe(scene.earlierDateBehaviorName);
      });

      then('preserves original wish content', () => {
        const wishContent = fs.readFileSync(
          path.join(scene.behaviorDir, '0.wish.md'),
          'utf-8',
        );
        expect(wishContent).toContain('original wish from earlier date');
      });
    });
  });

  // 🔴 the critipath `case=010`, through the cli a driver runs. a re-init keeps a guard and a
  //    stone stamped from a prior template, and must name both, never read as a clean `kept`
  given('[case10] direct: re-init over a guard and a stone from a prior template', () => {
    when('[t0] the guard lacks a review and the stone lacks the map ask', () => {
      const scene = useBeforeAll(async () => {
        const consumer = genConsumerRepo({
          branchName: 'feature/reinit-stale-test',
        });

        // first run stamps the current templates
        const first = runInitBehaviorSkillDirect({
          args: '--name reinit-stale',
          repoDir: consumer.repoDir,
        });

        // stamp a prior guard and a prior stone over them
        const behaviorRoot = path.join(consumer.repoDir, '.behavior');
        const behaviorDir = path.join(
          behaviorRoot,
          fs.readdirSync(behaviorRoot)[0]!,
        );
        const guardPath = path.join(behaviorDir, '1.vision.guard');
        const guardPrior = fs
          .readFileSync(guardPath, 'utf-8')
          .replace(/^\s*- slug: yagni-and-simplicity\s*$\n/m, '');
        fs.writeFileSync(guardPath, guardPrior);
        const stonePath = path.join(behaviorDir, '1.vision.stone');
        const stoneFirst = fs.readFileSync(stonePath, 'utf-8');
        const stonePrior = stoneFirst.replace(
          'draw at least one ascii map',
          'draw a picture',
        );
        fs.writeFileSync(stonePath, stonePrior);

        // the re-init a driver runs
        const second = runInitBehaviorSkillDirect({
          args: '--name reinit-stale',
          repoDir: consumer.repoDir,
        });

        return {
          ...consumer,
          first,
          second,
          guardPath,
          guardPrior,
          stonePath,
          stoneFirst,
          stonePrior,
        };
      });

      then('the first run renders the map ask into the vision stone', () => {
        expect(scene.first.exitCode).toBe(0);
        expect(scene.stoneFirst).toContain('draw at least one ascii map');
        expect(scene.stoneFirst).toContain('bind the map as an index');
      });

      then('the re-init succeeds and keeps both files untouched', () => {
        expect(scene.second.exitCode).toBe(0);
        expect(fs.readFileSync(scene.guardPath, 'utf-8')).toEqual(
          scene.guardPrior,
        );
        expect(fs.readFileSync(scene.stonePath, 'utf-8')).toEqual(
          scene.stonePrior,
        );
      });

      then('the guard is named with the review it lacks and how to adopt it', () => {
        expect(scene.second.stdout).toContain(
          '1 kept guard lacks reviews its template holds',
        );
        expect(scene.second.stdout).toContain('lacks: yagni-and-simplicity');
        expect(scene.second.stdout).toContain(
          'rhx route.guard.upgrade --stone 1.vision',
        );
      });

      then('the stone is named as drifted from its template', () => {
        expect(scene.second.stdout).toContain(
          '1 kept stone drifted from its template, in its whole text',
        );
        expect(scene.second.stdout).toContain('├─ 1.vision.stone');
      });

      then('the re-init output matches the snapshot', () => {
        expect(asSnapshotStable(scene.second.stdout)).toMatchSnapshot();
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
