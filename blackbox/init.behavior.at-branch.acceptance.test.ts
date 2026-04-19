import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { given, then, useThen, when } from 'test-fns';

import { genConsumerRepo } from './.test/infra/genConsumerRepo';
import {
  asSnapshotStable,
  runInitBehaviorSkillDirect,
} from './role=behaver/.test/skill.init.behavior.utils';

describe('init.behavior --name @branch', () => {
  given('[case1] feature branch with author prefix', () => {
    const scene = { repoDir: '' };
    beforeAll(() => {
      const { repoDir } = genConsumerRepo({
        prefix: 'at-branch-feature',
        branchName: 'casey/add-user-auth',
      });
      scene.repoDir = repoDir;
    });

    when('[t0] user runs init.behavior --name @branch', () => {
      const result = useThen('it succeeds', () =>
        runInitBehaviorSkillDirect({
          args: '--name @branch',
          repoDir: scene.repoDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.exitCode).toEqual(0);
      });

      then('stdout matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(asSnapshotStable(result.stderr)).toMatchSnapshot();
      });

      then('behavior created with last segment as name', () => {
        const behaviorDirs = fs.readdirSync(
          path.join(scene.repoDir, '.behavior'),
        );
        const behaviorDir = behaviorDirs.find((d) =>
          d.includes('.add-user-auth'),
        );
        expect(behaviorDir).toBeDefined();
        expect(behaviorDir).not.toContain('casey');
      });
    });
  });

  given('[case2] bare branch without slashes', () => {
    const scene = { repoDir: '' };
    beforeAll(() => {
      const { repoDir } = genConsumerRepo({
        prefix: 'at-branch-bare',
        branchName: 'fix-urgent-bug',
      });
      scene.repoDir = repoDir;
    });

    when('[t0] user runs init.behavior --name @branch', () => {
      const result = useThen('it succeeds', () =>
        runInitBehaviorSkillDirect({
          args: '--name @branch',
          repoDir: scene.repoDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.exitCode).toEqual(0);
      });

      then('stdout matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(asSnapshotStable(result.stderr)).toMatchSnapshot();
      });

      then('behavior created with full branch name', () => {
        const behaviorDirs = fs.readdirSync(
          path.join(scene.repoDir, '.behavior'),
        );
        const behaviorDir = behaviorDirs.find((d) =>
          d.includes('.fix-urgent-bug'),
        );
        expect(behaviorDir).toBeDefined();
      });
    });
  });

  given('[case3] on main branch', () => {
    const scene = { repoDir: '' };
    beforeAll(() => {
      const { repoDir } = genConsumerRepo({
        prefix: 'at-branch-main',
        branchName: 'main', // explicit main (CI default might be master)
      });
      scene.repoDir = repoDir;
    });

    when('[t0] user runs init.behavior --name @branch', () => {
      const result = useThen('it fails', () =>
        runInitBehaviorSkillDirect({
          args: '--name @branch',
          repoDir: scene.repoDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.exitCode).not.toEqual(0);
      });

      then('error message mentions protected branch', () => {
        expect(result.stderr).toContain(
          'cannot init behavior on protected branch: main',
        );
      });

      then('stdout matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(asSnapshotStable(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case4] on master branch', () => {
    const scene = { repoDir: '' };
    beforeAll(() => {
      const { repoDir } = genConsumerRepo({
        prefix: 'at-branch-master',
        branchName: 'master',
      });
      scene.repoDir = repoDir;
    });

    when('[t0] user runs init.behavior --name @branch', () => {
      const result = useThen('it fails', () =>
        runInitBehaviorSkillDirect({
          args: '--name @branch',
          repoDir: scene.repoDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.exitCode).not.toEqual(0);
      });

      then('error message mentions protected branch', () => {
        expect(result.stderr).toContain(
          'cannot init behavior on protected branch: master',
        );
      });

      then('stdout matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(asSnapshotStable(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case5] detached HEAD state', () => {
    const scene = { repoDir: '' };
    beforeAll(() => {
      const { repoDir } = genConsumerRepo({
        prefix: 'at-branch-detached',
        branchName: 'temp-branch',
      });
      // detach HEAD via checkout of commit directly
      execSync('git checkout HEAD~0 --detach', { cwd: repoDir });
      scene.repoDir = repoDir;
    });

    when('[t0] user runs init.behavior --name @branch', () => {
      const result = useThen('it fails', () =>
        runInitBehaviorSkillDirect({
          args: '--name @branch',
          repoDir: scene.repoDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.exitCode).not.toEqual(0);
      });

      then('error message mentions detached HEAD', () => {
        expect(result.stderr).toContain(
          'cannot expand @branch in detached HEAD state',
        );
      });

      then('stdout matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(asSnapshotStable(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case6] explicit name (regression test)', () => {
    const scene = { repoDir: '' };
    beforeAll(() => {
      const { repoDir } = genConsumerRepo({
        prefix: 'at-branch-explicit',
        branchName: 'casey/some-branch',
      });
      scene.repoDir = repoDir;
    });

    when('[t0] user runs init.behavior --name my-explicit-name', () => {
      const result = useThen('it succeeds', () =>
        runInitBehaviorSkillDirect({
          args: '--name my-explicit-name',
          repoDir: scene.repoDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.exitCode).toEqual(0);
      });

      then('stdout matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(asSnapshotStable(result.stderr)).toMatchSnapshot();
      });

      then('behavior created with explicit name (not branch)', () => {
        const behaviorDirs = fs.readdirSync(
          path.join(scene.repoDir, '.behavior'),
        );
        const behaviorDir = behaviorDirs.find((d) =>
          d.includes('.my-explicit-name'),
        );
        expect(behaviorDir).toBeDefined();
        expect(behaviorDir).not.toContain('some-branch');
      });
    });
  });
});
