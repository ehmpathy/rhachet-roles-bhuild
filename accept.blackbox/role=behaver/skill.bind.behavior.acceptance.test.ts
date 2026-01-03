import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  genConsumerRepo,
  genBehaviorFixture,
  runRhachetSkill,
  type ConsumerRepo,
} from '../.test/infra';

const runBindBehaviorSkill = (input: {
  action: 'get' | 'set' | 'del';
  behaviorName?: string;
  repoDir: string;
}) => {
  let args = input.action;
  if (input.action === 'set' && input.behaviorName) {
    args += ` --behavior "${input.behaviorName}"`;
  }
  return runRhachetSkill({
    repo: 'bhuild',
    skill: 'bind.behavior',
    args,
    repoDir: input.repoDir,
  });
};

describe('behaver.bind.behavior acceptance (as consumer)', () => {
  given('[case1] unbound branch with existing behavior', () => {
    let consumer: ConsumerRepo;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'bind-behavior-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'test-feature',
      });
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] get is invoked', () => {
      const result = useBeforeAll(async () =>
        runBindBehaviorSkill({
          action: 'get',
          repoDir: consumer.repoDir,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('outputs "not bound"', () => {
        expect(result.output).toContain('not bound');
      });
    });

    when('[t1] set --behavior test-feature is invoked', () => {
      then('exits with code 0', () => {
        execSync('git checkout -b bind-test-branch', { cwd: consumer.repoDir });

        const result = runBindBehaviorSkill({
          action: 'set',
          behaviorName: 'test-feature',
          repoDir: consumer.repoDir,
        });

        expect(result.exitCode).toBe(0);
      });

      then('creates bind flag file', () => {
        execSync('git checkout -b bind-flag-test', { cwd: consumer.repoDir });

        runBindBehaviorSkill({
          action: 'set',
          behaviorName: 'test-feature',
          repoDir: consumer.repoDir,
        });

        const bindDir = path.join(
          consumer.repoDir,
          '.behavior',
          'v2025_01_01.test-feature',
          '.bind',
        );
        expect(fs.existsSync(bindDir)).toBe(true);

        const flags = fs.readdirSync(bindDir);
        expect(flags.length).toBeGreaterThan(0);
      });

      then('outputs success message', () => {
        execSync('git checkout -b success-test', { cwd: consumer.repoDir });

        const result = runBindBehaviorSkill({
          action: 'set',
          behaviorName: 'test-feature',
          repoDir: consumer.repoDir,
        });

        expect(result.output).toContain('bound');
      });
    });
  });

  given('[case2] bound branch', () => {
    let consumer: ConsumerRepo;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'bind-behavior-bound-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'bound-feature',
      });

      execSync('git checkout -b already-bound', { cwd: consumer.repoDir });
      runBindBehaviorSkill({
        action: 'set',
        behaviorName: 'bound-feature',
        repoDir: consumer.repoDir,
      });
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] get is invoked', () => {
      const result = useBeforeAll(async () =>
        runBindBehaviorSkill({
          action: 'get',
          repoDir: consumer.repoDir,
        }),
      );

      then('outputs the bound behavior name', () => {
        expect(result.output).toContain('bound-feature');
      });
    });

    when('[t1] del is invoked', () => {
      const delResult = useBeforeAll(async () =>
        runBindBehaviorSkill({
          action: 'del',
          repoDir: consumer.repoDir,
        }),
      );

      then('exits with code 0', () => {
        expect(delResult.exitCode).toBe(0);
      });

      then('removes the binding', () => {
        const getResult = runBindBehaviorSkill({
          action: 'get',
          repoDir: consumer.repoDir,
        });
        expect(getResult.output).toContain('not bound');
      });
    });
  });

  given('[case3] set with nonexistent behavior', () => {
    let consumer: ConsumerRepo;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'bind-behavior-notfound-test-' });
      genBehaviorFixture({
        repoDir: consumer.repoDir,
        behaviorName: 'some-feature',
      });
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] skill is invoked with unknown behavior name', () => {
      const result = useBeforeAll(async () =>
        runBindBehaviorSkill({
          action: 'set',
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
