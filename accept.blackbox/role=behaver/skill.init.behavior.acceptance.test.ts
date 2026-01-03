import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  genConsumerRepo,
  runRhachetSkill,
  type ConsumerRepo,
} from '../.test/infra';

const runInitBehaviorSkill = (input: { behaviorName: string; repoDir: string }) =>
  runRhachetSkill({
    repo: 'bhuild',
    skill: 'init.behavior',
    args: `--name "${input.behaviorName}"`,
    repoDir: input.repoDir,
  });

describe('behaver.init.behavior acceptance (as consumer)', () => {
  given('[case1] fresh consumer repo on main branch', () => {
    let consumer: ConsumerRepo;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'init-behavior-test-' });
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] init.behavior --name test-feature is invoked', () => {
      then('exits with code 0', () => {
        const result = runInitBehaviorSkill({
          behaviorName: 'test-feature',
          repoDir: consumer.repoDir,
        });

        expect(result.exitCode).toBe(0);
      });

      then('creates behavior directory with scaffold files', () => {
        // create new branch for this test (main is already bound by prior test)
        execSync('git checkout -b scaffold-test-branch', {
          cwd: consumer.repoDir,
        });

        runInitBehaviorSkill({
          behaviorName: 'scaffold-test',
          repoDir: consumer.repoDir,
        });

        // find behavior directory (dated)
        const behaviorRoot = path.join(consumer.repoDir, '.behavior');
        expect(fs.existsSync(behaviorRoot)).toBe(true);

        const behaviorDirs = fs.readdirSync(behaviorRoot);
        const scaffoldDir = behaviorDirs.find((d) =>
          d.includes('scaffold-test'),
        );
        expect(scaffoldDir).toBeDefined();

        // verify scaffold files exist
        const behaviorPath = path.join(behaviorRoot, scaffoldDir!);
        expect(fs.existsSync(path.join(behaviorPath, '0.wish.md'))).toBe(true);
        expect(fs.existsSync(path.join(behaviorPath, '1.vision.md'))).toBe(
          true,
        );
        expect(
          fs.existsSync(path.join(behaviorPath, '2.criteria.blackbox.md')),
        ).toBe(true);
        expect(
          fs.existsSync(path.join(behaviorPath, '3.3.blueprint.v1.src')),
        ).toBe(true);
      });

      then('auto-binds current branch to the behavior', () => {
        // create new branch for this test
        execSync('git checkout -b auto-bind-test', { cwd: consumer.repoDir });

        runInitBehaviorSkill({
          behaviorName: 'auto-bind-test',
          repoDir: consumer.repoDir,
        });

        // check bind flag exists
        const behaviorRoot = path.join(consumer.repoDir, '.behavior');
        const behaviorDirs = fs.readdirSync(behaviorRoot);
        const autoBindDir = behaviorDirs.find((d) =>
          d.includes('auto-bind-test'),
        );
        expect(autoBindDir).toBeDefined();

        const bindDir = path.join(behaviorRoot, autoBindDir!, '.bind');
        expect(fs.existsSync(bindDir)).toBe(true);

        const bindFlags = fs.readdirSync(bindDir);
        expect(bindFlags.length).toBeGreaterThan(0);
      });

      then('outputs success message', () => {
        execSync('git checkout -b output-test', { cwd: consumer.repoDir });

        const result = runInitBehaviorSkill({
          behaviorName: 'output-test',
          repoDir: consumer.repoDir,
        });

        expect(result.output).toContain('behavior thoughtroute initialized');
      });
    });
  });

  given('[case2] branch already bound to a behavior', () => {
    let consumer: ConsumerRepo;

    beforeAll(() => {
      consumer = genConsumerRepo({ prefix: 'init-behavior-bound-test-' });
      // create branch and init first behavior
      execSync('git checkout -b already-bound-branch', {
        cwd: consumer.repoDir,
      });
      runInitBehaviorSkill({
        behaviorName: 'first-behavior',
        repoDir: consumer.repoDir,
      });
    });

    afterAll(() => {
      consumer.cleanup();
    });

    when('[t0] init.behavior --name second-behavior is invoked', () => {
      const result = useBeforeAll(async () =>
        runInitBehaviorSkill({
          behaviorName: 'second-behavior',
          repoDir: consumer.repoDir,
        }),
      );

      then('exits with non-zero code', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions branch is already bound', () => {
        expect(result.output).toContain('already bound');
      });
    });
  });
});
