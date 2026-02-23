import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genConsumerRepo } from '../.test/infra';

import {
  asSnapshotStable,
  runInitBehaviorSkillDirect,
} from './.test/skill.init.behavior.utils';

describe('init.behavior.flags', () => {
  given('[case6] direct: --open flag with cat command', () => {
    when('[t0] init.behavior executed with --open cat', () => {
      const scene = useBeforeAll(async () =>
        genConsumerRepo({ branchName: 'feature/open-cat-test' }),
      );

      then('cat command outputs wish file content', () => {
        const result = runInitBehaviorSkillDirect({
          args: '--name open-test --open cat',
          repoDir: scene.repoDir,
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
          repoDir: repoDir,
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
          repoDir: repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('🌲 go on then,');
        expect(result.stdout).toContain('0.wish.md');

        // snapshot for vibe-check
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
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
          repoDir: scene.repoDir,
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
          repoDir: repoDir,
        });

        expect(result.stdout).toContain('unavailable');
      });
    });
  });
});
