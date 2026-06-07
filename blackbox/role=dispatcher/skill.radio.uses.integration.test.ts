/**
 * .what = acceptance tests for radio.uses permission controls
 * .why = verify the 24-row precedence matrix works as expected
 */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { genConsumerRepo, runRhachetSkill } from '../.test/infra';

/**
 * .what = invoke radio.uses skill
 * .why = test helper for acceptance tests
 */
const runRadioUses = (input: {
  repoDir: string;
  args: string;
  homeDir?: string;
}): { stdout: string; stderr: string; exitCode: number } => {
  const result = runRhachetSkill({
    repo: 'bhuild',
    role: 'dispatcher',
    skill: 'radio.uses',
    args: input.args,
    repoDir: input.repoDir,
    env: {
      __I_AM_HUMAN: 'true',
      ...(input.homeDir ? { HOME: input.homeDir } : {}),
    },
    timeout: 30000,
  });
  return {
    stdout: result.output,
    stderr: '',
    exitCode: result.exitCode,
  };
};

/**
 * .what = invoke radio.task.push skill
 * .why = test that permission gate works
 */
const runRadioTaskPush = (input: {
  repoDir: string;
  via: string;
  into: string;
  title: string;
  description: string;
  homeDir?: string;
}): { stdout: string; exitCode: number } => {
  const args = `--via ${input.via} --into "${input.into}" --title "${input.title}" --description "${input.description}"`;
  const result = runRhachetSkill({
    repo: 'bhuild',
    role: 'dispatcher',
    skill: 'radio.task.push',
    args,
    repoDir: input.repoDir,
    env: input.homeDir ? { HOME: input.homeDir } : {},
    timeout: 30000,
  });
  return { stdout: result.output, exitCode: result.exitCode };
};

describe('radio.uses acceptance', () => {
  describe('precedence matrix', () => {
    given('[case1] all unset (default blocked)', () => {
      const scene = useBeforeAll(async () => {
        const consumer = await genConsumerRepo({ prefix: 'radio-uses-acpt-' });
        const homeDir = path.join(consumer.repoDir, '.home');
        fs.mkdirSync(homeDir);
        return { consumer, homeDir };
      });

      when('[t0] radio.uses get is called', () => {
        const result = useThen('skill runs', () =>
          runRadioUses({
            repoDir: scene.consumer.repoDir,
            args: 'get',
            homeDir: scene.homeDir,
          }),
        );

        then('shows unset states', () => {
          expect(result.stdout).toContain('unset');
        });

        then('output matches snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });

      when('[t1] radio.task.push is called', () => {
        const result = useThen('skill runs', () =>
          runRadioTaskPush({
            repoDir: scene.consumer.repoDir,
            via: 'os.fileops',
            into: 'ehmpathy/test-repo',
            title: 'test task',
            description: 'test description',
            homeDir: scene.homeDir,
          }),
        );

        then('push is blocked', () => {
          expect(result.exitCode).toBe(2);
        });

        then('output mentions blocked', () => {
          expect(result.stdout.toLowerCase()).toContain('blocked');
        });
      });
    });

    given('[case2] global blocked', () => {
      const scene = useBeforeAll(async () => {
        const consumer = await genConsumerRepo({ prefix: 'radio-uses-global-' });
        const homeDir = path.join(consumer.repoDir, '.home');
        fs.mkdirSync(homeDir);

        // set global blocked
        runRadioUses({
          repoDir: consumer.repoDir,
          args: '--global block',
          homeDir,
        });

        return { consumer, homeDir };
      });

      when('[t0] radio.uses get is called', () => {
        const result = useThen('skill runs', () =>
          runRadioUses({
            repoDir: scene.consumer.repoDir,
            args: 'get',
            homeDir: scene.homeDir,
          }),
        );

        then('shows global blocked', () => {
          expect(result.stdout).toContain('blocked');
        });

        then('output matches snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });

      when('[t1] local allow does not override global block', () => {
        const result = useThen('skill runs', () => {
          // set local allow
          runRadioUses({
            repoDir: scene.consumer.repoDir,
            args: 'allow',
            homeDir: scene.homeDir,
          });

          // push should still be blocked
          return runRadioTaskPush({
            repoDir: scene.consumer.repoDir,
            via: 'os.fileops',
            into: 'ehmpathy/test-repo',
            title: 'test task',
            description: 'test description',
            homeDir: scene.homeDir,
          });
        });

        then('push is still blocked', () => {
          expect(result.exitCode).toBe(2);
        });
      });
    });

    given('[case3] local allowed (explicit)', () => {
      const scene = useBeforeAll(async () => {
        const consumer = await genConsumerRepo({ prefix: 'radio-uses-local-' });
        const homeDir = path.join(consumer.repoDir, '.home');
        fs.mkdirSync(homeDir);

        // set local allowed
        runRadioUses({
          repoDir: consumer.repoDir,
          args: 'allow',
          homeDir,
        });

        // cleanup: create dummy global radio dir
        const globalRadioDir = path.join(
          homeDir,
          'git',
          '.radio',
          'ehmpathy',
          'test-repo-local',
        );
        fs.mkdirSync(globalRadioDir, { recursive: true });

        return { consumer, homeDir, globalRadioDir };
      });

      afterAll(async () => {
        await fs.promises.rm(scene.globalRadioDir, { recursive: true, force: true });
      });

      when('[t0] radio.uses get is called', () => {
        const result = useThen('skill runs', () =>
          runRadioUses({
            repoDir: scene.consumer.repoDir,
            args: 'get',
            homeDir: scene.homeDir,
          }),
        );

        then('shows local allowed', () => {
          expect(result.stdout).toContain('allowed');
        });

        then('output matches snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });

      when('[t1] radio.task.push is called', () => {
        const result = useThen('skill runs', () =>
          runRadioTaskPush({
            repoDir: scene.consumer.repoDir,
            via: 'os.fileops',
            into: 'ehmpathy/test-repo-local',
            title: 'local allowed test',
            description: 'should succeed',
            homeDir: scene.homeDir,
          }),
        );

        then('push succeeds', () => {
          expect(result.exitCode).toBe(0);
        });
      });
    });

    given('[case4] org @all allowed', () => {
      const scene = useBeforeAll(async () => {
        const consumer = await genConsumerRepo({ prefix: 'radio-uses-org-all-' });
        const homeDir = path.join(consumer.repoDir, '.home');
        fs.mkdirSync(homeDir);

        // set @all allowed
        runRadioUses({
          repoDir: consumer.repoDir,
          args: '--org @all allow',
          homeDir,
        });

        // cleanup: create dummy global radio dir
        const globalRadioDir = path.join(
          homeDir,
          'git',
          '.radio',
          'anyorg',
          'test-repo-org',
        );
        fs.mkdirSync(globalRadioDir, { recursive: true });

        return { consumer, homeDir, globalRadioDir };
      });

      afterAll(async () => {
        await fs.promises.rm(scene.globalRadioDir, { recursive: true, force: true });
      });

      when('[t0] radio.uses get is called', () => {
        const result = useThen('skill runs', () =>
          runRadioUses({
            repoDir: scene.consumer.repoDir,
            args: 'get',
            homeDir: scene.homeDir,
          }),
        );

        then('shows org @all allowed', () => {
          expect(result.stdout).toContain('@all');
        });

        then('output matches snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });

      when('[t1] radio.task.push to any org succeeds', () => {
        const result = useThen('skill runs', () =>
          runRadioTaskPush({
            repoDir: scene.consumer.repoDir,
            via: 'os.fileops',
            into: 'anyorg/test-repo-org',
            title: 'org all test',
            description: 'should succeed via @all',
            homeDir: scene.homeDir,
          }),
        );

        then('push succeeds', () => {
          expect(result.exitCode).toBe(0);
        });
      });
    });

    given('[case5] org specific overrides @all', () => {
      const scene = useBeforeAll(async () => {
        const consumer = await genConsumerRepo({ prefix: 'radio-uses-org-spec-' });
        const homeDir = path.join(consumer.repoDir, '.home');
        fs.mkdirSync(homeDir);

        // set @all blocked, but ehmpathy allowed
        runRadioUses({
          repoDir: consumer.repoDir,
          args: '--org @all block',
          homeDir,
        });
        runRadioUses({
          repoDir: consumer.repoDir,
          args: '--org ehmpathy allow',
          homeDir,
        });

        // cleanup: create dummy global radio dirs
        const ehmpathyRadioDir = path.join(
          homeDir,
          'git',
          '.radio',
          'ehmpathy',
          'test-repo-ehmpathy',
        );
        const otherRadioDir = path.join(
          homeDir,
          'git',
          '.radio',
          'otherorg',
          'test-repo-other',
        );
        fs.mkdirSync(ehmpathyRadioDir, { recursive: true });
        fs.mkdirSync(otherRadioDir, { recursive: true });

        return { consumer, homeDir, ehmpathyRadioDir, otherRadioDir };
      });

      afterAll(async () => {
        await fs.promises.rm(scene.ehmpathyRadioDir, { recursive: true, force: true });
        await fs.promises.rm(scene.otherRadioDir, { recursive: true, force: true });
      });

      when('[t0] radio.uses get is called', () => {
        const result = useThen('skill runs', () =>
          runRadioUses({
            repoDir: scene.consumer.repoDir,
            args: 'get',
            homeDir: scene.homeDir,
          }),
        );

        then('shows org config', () => {
          expect(result.stdout).toContain('ehmpathy');
        });

        then('output matches snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });

      when('[t1] push to ehmpathy org succeeds', () => {
        const result = useThen('skill runs', () =>
          runRadioTaskPush({
            repoDir: scene.consumer.repoDir,
            via: 'os.fileops',
            into: 'ehmpathy/test-repo-ehmpathy',
            title: 'ehmpathy test',
            description: 'should succeed via org specific',
            homeDir: scene.homeDir,
          }),
        );

        then('push succeeds', () => {
          expect(result.exitCode).toBe(0);
        });
      });

      when('[t2] push to other org is blocked', () => {
        const result = useThen('skill runs', () =>
          runRadioTaskPush({
            repoDir: scene.consumer.repoDir,
            via: 'os.fileops',
            into: 'otherorg/test-repo-other',
            title: 'other org test',
            description: 'should be blocked via @all',
            homeDir: scene.homeDir,
          }),
        );

        then('push is blocked', () => {
          expect(result.exitCode).toBe(2);
        });
      });
    });

    given('[case6] org allowed overrides local blocked (org > local)', () => {
      const scene = useBeforeAll(async () => {
        const consumer = await genConsumerRepo({
          prefix: 'radio-uses-org-over-local-',
        });
        const homeDir = path.join(consumer.repoDir, '.home');
        fs.mkdirSync(homeDir);

        // set local blocked first, then org @all allowed
        runRadioUses({
          repoDir: consumer.repoDir,
          args: 'block',
          homeDir,
        });
        runRadioUses({
          repoDir: consumer.repoDir,
          args: '--org @all allow',
          homeDir,
        });

        // cleanup: create dummy global radio dir
        const globalRadioDir = path.join(
          homeDir,
          'git',
          '.radio',
          'ehmpathy',
          'test-repo-org-over-local',
        );
        fs.mkdirSync(globalRadioDir, { recursive: true });

        return { consumer, homeDir, globalRadioDir };
      });

      afterAll(async () => {
        await fs.promises.rm(scene.globalRadioDir, { recursive: true, force: true });
      });

      when('[t0] radio.uses get is called', () => {
        const result = useThen('skill runs', () =>
          runRadioUses({
            repoDir: scene.consumer.repoDir,
            args: 'get',
            homeDir: scene.homeDir,
          }),
        );

        then('shows both local blocked and org allowed', () => {
          expect(result.stdout).toContain('blocked');
          expect(result.stdout).toContain('allowed');
        });

        then('output matches snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });

      when('[t1] radio.task.push succeeds (org overrides local)', () => {
        const result = useThen('skill runs', () =>
          runRadioTaskPush({
            repoDir: scene.consumer.repoDir,
            via: 'os.fileops',
            into: 'ehmpathy/test-repo-org-over-local',
            title: 'org over local test',
            description: 'org @all allowed should override local blocked',
            homeDir: scene.homeDir,
          }),
        );

        then('push succeeds', () => {
          expect(result.exitCode).toBe(0);
        });
      });
    });

    given('[case7] org blocked overrides local allowed (org > local)', () => {
      const scene = useBeforeAll(async () => {
        const consumer = await genConsumerRepo({
          prefix: 'radio-uses-org-block-over-local-',
        });
        const homeDir = path.join(consumer.repoDir, '.home');
        fs.mkdirSync(homeDir);

        // set local allowed first, then org @all blocked
        runRadioUses({
          repoDir: consumer.repoDir,
          args: 'allow',
          homeDir,
        });
        runRadioUses({
          repoDir: consumer.repoDir,
          args: '--org @all block',
          homeDir,
        });

        return { consumer, homeDir };
      });

      when('[t0] radio.uses get is called', () => {
        const result = useThen('skill runs', () =>
          runRadioUses({
            repoDir: scene.consumer.repoDir,
            args: 'get',
            homeDir: scene.homeDir,
          }),
        );

        then('shows both local allowed and org blocked', () => {
          expect(result.stdout).toContain('allowed');
          expect(result.stdout).toContain('blocked');
        });

        then('output matches snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });

      when('[t1] radio.task.push is blocked (org overrides local)', () => {
        const result = useThen('skill runs', () =>
          runRadioTaskPush({
            repoDir: scene.consumer.repoDir,
            via: 'os.fileops',
            into: 'ehmpathy/test-repo',
            title: 'org block over local test',
            description: 'org @all blocked should override local allowed',
            homeDir: scene.homeDir,
          }),
        );

        then('push is blocked', () => {
          expect(result.exitCode).toBe(2);
        });

        then('output shows blocked with org hint', () => {
          expect(result.stdout).toContain('blocked');
          expect(result.stdout).toContain('--org');
        });

        then('output matches snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });
    });

    given('[case8] specific org overrides local (org > local)', () => {
      const scene = useBeforeAll(async () => {
        const consumer = await genConsumerRepo({
          prefix: 'radio-uses-spec-org-over-local-',
        });
        const homeDir = path.join(consumer.repoDir, '.home');
        fs.mkdirSync(homeDir);

        // set local allowed
        runRadioUses({
          repoDir: consumer.repoDir,
          args: 'allow',
          homeDir,
        });
        // set specific org blocked (not @all)
        runRadioUses({
          repoDir: consumer.repoDir,
          args: '--org ehmpathy block',
          homeDir,
        });

        return { consumer, homeDir };
      });

      when('[t0] push to ehmpathy is blocked (specific org)', () => {
        const result = useThen('skill runs', () =>
          runRadioTaskPush({
            repoDir: scene.consumer.repoDir,
            via: 'os.fileops',
            into: 'ehmpathy/test-repo',
            title: 'specific org block test',
            description: 'specific org blocked should override local allowed',
            homeDir: scene.homeDir,
          }),
        );

        then('push is blocked', () => {
          expect(result.exitCode).toBe(2);
        });

        then('output shows blocked with org hint', () => {
          expect(result.stdout).toContain('blocked');
          expect(result.stdout).toContain('--org ehmpathy');
        });

        then('output matches snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });

      when('[t1] push to other org uses local (fallback)', () => {
        const result = useThen('skill runs', () => {
          // create radio dir for other org inside useThen callback
          const otherRadioDir = path.join(
            scene.homeDir,
            'git',
            '.radio',
            'otherorg',
            'test-repo-other',
          );
          fs.mkdirSync(otherRadioDir, { recursive: true });

          return runRadioTaskPush({
            repoDir: scene.consumer.repoDir,
            via: 'os.fileops',
            into: 'otherorg/test-repo-other',
            title: 'other org local test',
            description: 'no org config for otherorg, local allowed should apply',
            homeDir: scene.homeDir,
          });
        });

        then('push succeeds via local fallback', () => {
          expect(result.exitCode).toBe(0);
        });
      });
    });
  });

  describe('hint level specificity', () => {
    given('[case9] global block shows global hint', () => {
      const scene = useBeforeAll(async () => {
        const consumer = await genConsumerRepo({
          prefix: 'radio-uses-hint-global-',
        });
        const homeDir = path.join(consumer.repoDir, '.home');
        fs.mkdirSync(homeDir);

        // set global blocked
        runRadioUses({
          repoDir: consumer.repoDir,
          args: '--global block',
          homeDir,
        });

        return { consumer, homeDir };
      });

      when('[t0] radio.task.push is called', () => {
        const result = useThen('skill runs', () =>
          runRadioTaskPush({
            repoDir: scene.consumer.repoDir,
            via: 'os.fileops',
            into: 'ehmpathy/test-repo',
            title: 'global hint test',
            description: 'should show --global hint',
            homeDir: scene.homeDir,
          }),
        );

        then('push is blocked', () => {
          expect(result.exitCode).toBe(2);
        });

        then('hint shows --global allow', () => {
          expect(result.stdout).toContain('--global allow');
        });

        then('output matches snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });
    });

    given('[case10] org block shows org hint', () => {
      const scene = useBeforeAll(async () => {
        const consumer = await genConsumerRepo({
          prefix: 'radio-uses-hint-org-',
        });
        const homeDir = path.join(consumer.repoDir, '.home');
        fs.mkdirSync(homeDir);

        // set org blocked
        runRadioUses({
          repoDir: consumer.repoDir,
          args: '--org ehmpathy block',
          homeDir,
        });

        return { consumer, homeDir };
      });

      when('[t0] radio.task.push is called', () => {
        const result = useThen('skill runs', () =>
          runRadioTaskPush({
            repoDir: scene.consumer.repoDir,
            via: 'os.fileops',
            into: 'ehmpathy/test-repo',
            title: 'org hint test',
            description: 'should show --org ehmpathy hint',
            homeDir: scene.homeDir,
          }),
        );

        then('push is blocked', () => {
          expect(result.exitCode).toBe(2);
        });

        then('hint shows --org ehmpathy allow', () => {
          expect(result.stdout).toContain('--org ehmpathy allow');
        });

        then('output matches snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });
    });

    given('[case11] default block shows local hint', () => {
      const scene = useBeforeAll(async () => {
        const consumer = await genConsumerRepo({
          prefix: 'radio-uses-hint-default-',
        });
        const homeDir = path.join(consumer.repoDir, '.home');
        fs.mkdirSync(homeDir);
        // no permissions set - default blocked
        return { consumer, homeDir };
      });

      when('[t0] radio.task.push is called', () => {
        const result = useThen('skill runs', () =>
          runRadioTaskPush({
            repoDir: scene.consumer.repoDir,
            via: 'os.fileops',
            into: 'ehmpathy/test-repo',
            title: 'default hint test',
            description: 'should show local hint (no --global or --org)',
            homeDir: scene.homeDir,
          }),
        );

        then('push is blocked', () => {
          expect(result.exitCode).toBe(2);
        });

        then('hint shows allow without --global or --org', () => {
          expect(result.stdout).toContain('radio.uses');
          expect(result.stdout).toContain('allow');
          expect(result.stdout).not.toContain('--global');
          expect(result.stdout).not.toContain('--org');
        });

        then('output matches snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });
    });
  });

  describe('user journey', () => {
    given('[case12] full permission workflow', () => {
      const scene = useBeforeAll(async () => {
        const consumer = await genConsumerRepo({ prefix: 'radio-uses-journey-' });
        const homeDir = path.join(consumer.repoDir, '.home');
        fs.mkdirSync(homeDir);

        // cleanup: create dummy global radio dir
        const globalRadioDir = path.join(
          homeDir,
          'git',
          '.radio',
          'ehmpathy',
          'test-repo-journey',
        );
        fs.mkdirSync(globalRadioDir, { recursive: true });

        return { consumer, homeDir, globalRadioDir };
      });

      afterAll(async () => {
        await fs.promises.rm(scene.globalRadioDir, { recursive: true, force: true });
      });

      when('[t0] initial push attempt (blocked)', () => {
        const result = useThen('skill runs', () =>
          runRadioTaskPush({
            repoDir: scene.consumer.repoDir,
            via: 'os.fileops',
            into: 'ehmpathy/test-repo-journey',
            title: 'journey step 1',
            description: 'initial attempt',
            homeDir: scene.homeDir,
          }),
        );

        then('push is blocked', () => {
          expect(result.exitCode).toBe(2);
        });

        then('output matches snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });

      when('[t1] user allows locally', () => {
        const result = useThen('skill runs', () => {
          runRadioUses({
            repoDir: scene.consumer.repoDir,
            args: 'allow',
            homeDir: scene.homeDir,
          });
          return runRadioUses({
            repoDir: scene.consumer.repoDir,
            args: 'get',
            homeDir: scene.homeDir,
          });
        });

        then('shows allowed', () => {
          expect(result.stdout).toContain('allowed');
        });

        then('output matches snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });

      when('[t2] push succeeds after allow', () => {
        const result = useThen('skill runs', () =>
          runRadioTaskPush({
            repoDir: scene.consumer.repoDir,
            via: 'os.fileops',
            into: 'ehmpathy/test-repo-journey',
            title: 'journey step 2',
            description: 'after allow',
            homeDir: scene.homeDir,
          }),
        );

        then('push succeeds', () => {
          expect(result.exitCode).toBe(0);
        });
      });

      when('[t3] user blocks locally', () => {
        const result = useThen('skill runs', () => {
          runRadioUses({
            repoDir: scene.consumer.repoDir,
            args: 'block',
            homeDir: scene.homeDir,
          });
          return runRadioUses({
            repoDir: scene.consumer.repoDir,
            args: 'get',
            homeDir: scene.homeDir,
          });
        });

        then('shows blocked', () => {
          expect(result.stdout).toContain('blocked');
        });

        then('output matches snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });

      when('[t4] push fails after block', () => {
        const result = useThen('skill runs', () =>
          runRadioTaskPush({
            repoDir: scene.consumer.repoDir,
            via: 'os.fileops',
            into: 'ehmpathy/test-repo-journey',
            title: 'journey step 3',
            description: 'after block',
            homeDir: scene.homeDir,
          }),
        );

        then('push is blocked', () => {
          expect(result.exitCode).toBe(2);
        });
      });
    });
  });
});
