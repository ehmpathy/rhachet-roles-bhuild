import { given, then, useBeforeAll, when } from 'test-fns';

import {
  genConsumerRepo,
  genBehaviorFixture,
  runRhachetSkill,
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
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'review-behavior-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'small-feature',
        withCriteria: true,
      });
      return consumer;
    });

    when('[t0] skill is invoked', () => {
      const result = useBeforeAll(async () =>
        runReviewBehaviorSkill({
          behaviorName: 'small-feature',
          repoDir: scene.repoDir,
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
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'review-behavior-nocriteria-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'incomplete-feature',
        withCriteria: false,
      });
      return consumer;
    });

    when('[t0] skill is invoked', () => {
      const result = useBeforeAll(async () =>
        runReviewBehaviorSkill({
          behaviorName: 'incomplete-feature',
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

  given('[case3] behavior not found', () => {
    const scene = useBeforeAll(async () => {
      const consumer = genConsumerRepo({ prefix: 'review-behavior-notfound-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'extant-feature',
        withCriteria: true,
      });
      return consumer;
    });

    when('[t0] skill invoked with unknown name', () => {
      const result = useBeforeAll(async () =>
        runReviewBehaviorSkill({
          behaviorName: 'nonexistent',
          repoDir: scene.repoDir,
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
