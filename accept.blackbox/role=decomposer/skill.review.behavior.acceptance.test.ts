import { given, then, useBeforeAll, when } from 'test-fns';

import {
  genConsumerRepo,
  genBehaviorFixture,
  runRhachetSkill,
  type ConsumerRepo,
} from '../.test/infra';

const runReviewBehaviorSkill = (input: { behaviorName: string; repoDir: string }) =>
  runRhachetSkill({
    repo: 'bhuild',
    role: 'decomposer',
    skill: 'review.behavior',
    args: `--of "${input.behaviorName}"`,
    repoDir: input.repoDir,
  });

describe('decomposer.review.behavior acceptance (as consumer)', () => {
  given('[case1] behavior with criteria under threshold', () => {
    let consumer: ConsumerRepo;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'review-behavior-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'small-feature',
        withCriteria: true,
      });
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] skill is invoked', () => {
      const result = useBeforeAll(async () =>
        runReviewBehaviorSkill({
          behaviorName: 'small-feature',
          repoDir: consumer.repoDir,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('outputs recommendation', () => {
        expect(result.output).toMatch(/DECOMPOSE_(REQUIRED|UNNEEDED)/);
      });

      then('outputs beaver intro', () => {
        expect(result.output).toContain("let's review!");
      });
    });
  });

  given('[case2] behavior without criteria', () => {
    let consumer: ConsumerRepo;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'review-behavior-nocriteria-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'incomplete-feature',
        withCriteria: false,
      });
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] skill is invoked', () => {
      const result = useBeforeAll(async () =>
        runReviewBehaviorSkill({
          behaviorName: 'incomplete-feature',
          repoDir: consumer.repoDir,
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

  given('[case3] behavior not found', () => {
    let consumer: ConsumerRepo;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'review-behavior-notfound-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'existing-feature',
        withCriteria: true,
      });
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] skill invoked with unknown name', () => {
      const result = useBeforeAll(async () =>
        runReviewBehaviorSkill({
          behaviorName: 'nonexistent',
          repoDir: consumer.repoDir,
        }),
      );

      then('exits with non-zero code', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions behavior not found', () => {
        expect(result.output).toContain('no behavior found');
      });
    });
  });
});
