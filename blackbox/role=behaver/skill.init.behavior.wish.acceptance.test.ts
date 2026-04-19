import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { genConsumerRepo } from '../.test/infra';

import {
  asSnapshotStable,
  runInitBehaviorSkillDirect,
} from './.test/skill.init.behavior.utils';

describe('init.behavior.wish', () => {
  given('[case1] --wish with inline content', () => {
    when('[t0] init.behavior executed with --wish "my inline wish"', () => {
      const scene = useBeforeAll(async () =>
        genConsumerRepo({ branchName: 'feature/wish-inline-test' }),
      );

      const result = useThen('skill executes', () =>
        runInitBehaviorSkillDirect({
          args: '--name wish-inline-test --wish "my inline wish"',
          repoDir: scene.repoDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('wish file contains content', () => {
        const behaviorRoot = path.join(scene.repoDir, '.behavior');
        const behaviorDirs = fs.readdirSync(behaviorRoot);
        const wishDir = behaviorDirs.find((d) =>
          d.includes('wish-inline-test'),
        );
        expect(wishDir).toBeDefined();

        const wishPath = path.join(behaviorRoot, wishDir!, '0.wish.md');
        const wishContent = fs.readFileSync(wishPath, 'utf-8');

        expect(wishContent).toEqual('wish =\n\nmy inline wish\n');
      });

      then('stdout matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(asSnapshotStable(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case2] --wish @stdin with piped content', () => {
    when('[t0] init.behavior executed with piped stdin', () => {
      const scene = useBeforeAll(async () =>
        genConsumerRepo({ branchName: 'feature/wish-stdin-test' }),
      );

      const result = useThen('skill executes', () =>
        runInitBehaviorSkillDirect({
          args: '--name wish-stdin-test --wish @stdin',
          repoDir: scene.repoDir,
          stdin: 'my piped wish content',
        }),
      );

      then('exit code is 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('wish file contains piped content', () => {
        const behaviorRoot = path.join(scene.repoDir, '.behavior');
        const behaviorDirs = fs.readdirSync(behaviorRoot);
        const wishDir = behaviorDirs.find((d) =>
          d.includes('wish-stdin-test'),
        );
        expect(wishDir).toBeDefined();

        const wishPath = path.join(behaviorRoot, wishDir!, '0.wish.md');
        const wishContent = fs.readFileSync(wishPath, 'utf-8');

        expect(wishContent).toEqual('wish =\n\nmy piped wish content\n');
      });

      then('stdout matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(asSnapshotStable(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case3] --wish @stdin with empty stdin', () => {
    when('[t0] init.behavior executed with empty piped stdin', () => {
      const scene = useBeforeAll(async () =>
        genConsumerRepo({ branchName: 'feature/wish-empty-test' }),
      );

      const result = useThen('skill executes', () =>
        runInitBehaviorSkillDirect({
          args: '--name wish-empty-test --wish @stdin',
          repoDir: scene.repoDir,
          stdin: '   ', // whitespace only
        }),
      );

      then('exit code is 2 (constraint error)', () => {
        expect(result.exitCode).toBe(2);
      });

      then('error message indicates content required', () => {
        expect(result.stderr).toContain('--wish requires content');
      });

      then('stdout matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(asSnapshotStable(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case3b] --wish with empty inline content', () => {
    when('[t0] init.behavior executed with --wish ""', () => {
      const scene = useBeforeAll(async () =>
        genConsumerRepo({ branchName: 'feature/wish-empty-inline-test' }),
      );

      const result = useThen('skill executes', () =>
        runInitBehaviorSkillDirect({
          args: '--name wish-empty-inline-test --wish ""',
          repoDir: scene.repoDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('error message indicates --wish is undefined', () => {
        expect(result.stderr).toContain('--wish must be a string');
      });

      then('stdout matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(asSnapshotStable(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case4] --wish on pre-populated wish file', () => {
    when('[t0] init.behavior executed twice with different wish', () => {
      const scene = useBeforeAll(async () => {
        const repo = await genConsumerRepo({
          branchName: 'feature/wish-conflict-test',
        });

        // first call to populate wish file
        runInitBehaviorSkillDirect({
          args: '--name wish-conflict-test --wish "first wish"',
          repoDir: repo.repoDir,
        });

        return repo;
      });

      const result = useThen('second call with different wish', () =>
        runInitBehaviorSkillDirect({
          args: '--name wish-conflict-test --wish "different wish"',
          repoDir: scene.repoDir,
        }),
      );

      then('exit code is 2 (constraint error)', () => {
        expect(result.exitCode).toBe(2);
      });

      then('error message indicates file was modified', () => {
        expect(result.stderr).toContain('wish file has been modified');
      });

      then('error message suggests how to overwrite', () => {
        expect(result.stderr).toContain('rm');
      });

      then('stdout matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(asSnapshotStable(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case5] --wish idempotent with same content', () => {
    when('[t0] init.behavior executed twice with same wish', () => {
      const scene = useBeforeAll(async () => {
        const repo = await genConsumerRepo({
          branchName: 'feature/wish-idempotent-test',
        });

        // first call to populate wish file
        runInitBehaviorSkillDirect({
          args: '--name wish-idempotent-test --wish "same wish"',
          repoDir: repo.repoDir,
        });

        return repo;
      });

      const result = useThen('second call with same wish', () =>
        runInitBehaviorSkillDirect({
          args: '--name wish-idempotent-test --wish "same wish"',
          repoDir: scene.repoDir,
        }),
      );

      then('exit code is 0 (idempotent)', () => {
        expect(result.exitCode).toBe(0);
      });

      then('wish file still has original content', () => {
        const behaviorRoot = path.join(scene.repoDir, '.behavior');
        const behaviorDirs = fs.readdirSync(behaviorRoot);
        const wishDir = behaviorDirs.find((d) =>
          d.includes('wish-idempotent-test'),
        );
        expect(wishDir).toBeDefined();

        const wishPath = path.join(behaviorRoot, wishDir!, '0.wish.md');
        const wishContent = fs.readFileSync(wishPath, 'utf-8');

        expect(wishContent).toEqual('wish =\n\nsame wish\n');
      });

      then('stdout matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(asSnapshotStable(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case6] --wish combined with --open', () => {
    when('[t0] init.behavior executed with --wish and --open cat', () => {
      const scene = useBeforeAll(async () =>
        genConsumerRepo({ branchName: 'feature/wish-open-test' }),
      );

      const result = useThen('skill executes', () =>
        runInitBehaviorSkillDirect({
          args: '--name wish-open-test --wish "wish before open" --open cat',
          repoDir: scene.repoDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('cat outputs wish file with content', () => {
        expect(result.stdout).toContain('wish before open');
      });

      then('wish file contains content', () => {
        const behaviorRoot = path.join(scene.repoDir, '.behavior');
        const behaviorDirs = fs.readdirSync(behaviorRoot);
        const wishDir = behaviorDirs.find((d) => d.includes('wish-open-test'));
        expect(wishDir).toBeDefined();

        const wishPath = path.join(behaviorRoot, wishDir!, '0.wish.md');
        const wishContent = fs.readFileSync(wishPath, 'utf-8');

        expect(wishContent).toEqual('wish =\n\nwish before open\n');
      });

      then('stdout matches snapshot', () => {
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(asSnapshotStable(result.stderr)).toMatchSnapshot();
      });
    });
  });
});
