import { given, then, useBeforeAll, when } from 'test-fns';

import {
  genConsumerRepo,
  genBehaviorFixture,
  runRhachetSkill,
} from '../.test/infra';

const runDecomposeSkill = (input: {
  behaviorName: string;
  mode: 'plan' | 'apply';
  repoDir: string;
  planFile?: string;
}) => {
  let args = `--of "${input.behaviorName}" --mode "${input.mode}"`;
  if (input.planFile) {
    args += ` --plan "${input.planFile}"`;
  }
  return runRhachetSkill({
    repo: 'bhuild',
    role: 'decomposer',
    skill: 'decompose.behavior',
    args,
    repoDir: input.repoDir,
  });
};

describe('decomposer.decompose acceptance (as consumer)', () => {
  given('[case1] behavior already decomposed', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'decompose-behavior-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'decomposed-feature',
        withCriteria: true,
        withDecomposed: true,
      });
      return consumer;
    });

    when('[t0] --mode plan is invoked', () => {
      const result = useBeforeAll(async () =>
        runDecomposeSkill({
          behaviorName: 'decomposed-feature',
          mode: 'plan',
          repoDir: scene.repoDir,
        }),
      );

      then('exits with code 0 (warns only)', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output warns about prior decomposition', () => {
        expect(result.output).toContain('already decomposed');
      });
    });
  });

  given('[case2] behavior without criteria', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'decompose-nocriteria-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'no-criteria-feature',
        withCriteria: false,
      });
      return consumer;
    });

    when('[t0] --mode plan is invoked', () => {
      const result = useBeforeAll(async () =>
        runDecomposeSkill({
          behaviorName: 'no-criteria-feature',
          mode: 'plan',
          repoDir: scene.repoDir,
        }),
      );

      then('exits with non-zero code', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions criteria requirement', () => {
        expect(result.output).toContain('criteria');
      });
    });
  });

  given('[case3] --mode apply without --plan', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'decompose-noplan-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'apply-test-feature',
        withCriteria: true,
      });
      return consumer;
    });

    when('[t0] invoked without plan file', () => {
      const result = useBeforeAll(async () =>
        runDecomposeSkill({
          behaviorName: 'apply-test-feature',
          mode: 'apply',
          repoDir: scene.repoDir,
        }),
      );

      then('exits with non-zero code', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions --plan requirement', () => {
        expect(result.output).toContain('--plan');
      });
    });
  });
});
