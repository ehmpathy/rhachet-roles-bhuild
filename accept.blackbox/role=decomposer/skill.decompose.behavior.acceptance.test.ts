import { given, then, when } from 'test-fns';

import {
  genConsumerRepo,
  genBehaviorFixture,
  runRhachetSkill,
  type ConsumerRepo,
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
    let consumer: ConsumerRepo;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'decompose-behavior-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'decomposed-feature',
        withCriteria: true,
        withDecomposed: true,
      });
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] --mode plan is invoked', () => {
      then('exits with code 0 (warns only)', () => {
        const result = runDecomposeSkill({
          behaviorName: 'decomposed-feature',
          mode: 'plan',
          repoDir: consumer.repoDir,
        });

        expect(result.exitCode).toBe(0);
      });

      then('output warns about prior decomposition', () => {
        const result = runDecomposeSkill({
          behaviorName: 'decomposed-feature',
          mode: 'plan',
          repoDir: consumer.repoDir,
        });

        expect(result.output).toContain('already decomposed');
      });
    });
  });

  given('[case2] behavior without criteria', () => {
    let consumer: ConsumerRepo;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'decompose-nocriteria-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'no-criteria-feature',
        withCriteria: false,
      });
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] --mode plan is invoked', () => {
      then('exits with non-zero code', () => {
        const result = runDecomposeSkill({
          behaviorName: 'no-criteria-feature',
          mode: 'plan',
          repoDir: consumer.repoDir,
        });

        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions criteria requirement', () => {
        const result = runDecomposeSkill({
          behaviorName: 'no-criteria-feature',
          mode: 'plan',
          repoDir: consumer.repoDir,
        });

        expect(result.output).toContain('criteria');
      });
    });
  });

  given('[case3] --mode apply without --plan', () => {
    let consumer: ConsumerRepo;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'decompose-noplan-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'apply-test-feature',
        withCriteria: true,
      });
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] invoked without plan file', () => {
      then('exits with non-zero code', () => {
        const result = runDecomposeSkill({
          behaviorName: 'apply-test-feature',
          mode: 'apply',
          repoDir: consumer.repoDir,
        });

        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions --plan requirement', () => {
        const result = runDecomposeSkill({
          behaviorName: 'apply-test-feature',
          mode: 'apply',
          repoDir: consumer.repoDir,
        });

        expect(result.output).toContain('--plan');
      });
    });
  });
});
