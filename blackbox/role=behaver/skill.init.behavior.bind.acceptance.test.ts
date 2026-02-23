import { given, then, useBeforeAll, when } from 'test-fns';

import { genConsumerRepo } from '../.test/infra';

import {
  asSnapshotStable,
  runInitBehaviorSkillDirect,
} from './.test/skill.init.behavior.utils';

describe('init.behavior.bind', () => {
  given('[case8] direct: route bind output', () => {
    when('[t0] init.behavior executed', () => {
      const scene = useBeforeAll(async () =>
        genConsumerRepo({ branchName: 'feature/route-bind-test' }),
      );

      then('output shows behavior bind line', () => {
        const result = runInitBehaviorSkillDirect({
          args: '--name route-test',
          repoDir: scene.repoDir,
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
          repoDir: repoDir,
        });

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('branch bound to route');
        expect(result.stdout).toContain('to drive via hooks');

        // snapshot for vibe-check (full output with both binds)
        expect(asSnapshotStable(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
