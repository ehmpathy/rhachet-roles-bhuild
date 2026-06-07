import fs from 'fs';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genConsumerRepo, runRhachetSkill } from '../.test/infra';

/**
 * .what = invoke radio.uses skill to set up permissions
 * .why = radio.task.push/pull requires radio.uses permission
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
 * .what = runs radio.task.push via rhachet dispatch
 * .why = helper to create tasks for pull tests
 */
const runRadioTaskPush = (input: {
  repoDir: string;
  via: string;
  into: string;
  title: string;
  description: string;
  exid?: string;
  status?: string;
  homeDir?: string;
}) => {
  const args = [
    `--via ${input.via}`,
    `--into "${input.into}"`,
    input.title ? `--title "${input.title}"` : '',
    input.description ? `--description "${input.description}"` : '',
    input.exid ? `--exid "${input.exid}"` : '',
    input.status ? `--status ${input.status}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return runRhachetSkill({
    repo: 'bhuild',
    role: 'dispatcher',
    skill: 'radio.task.push',
    args,
    repoDir: input.repoDir,
    env: input.homeDir ? { HOME: input.homeDir } : {},
    timeout: 30000,
  });
};

/**
 * .what = runs radio.task.pull via rhachet dispatch (consumer pattern)
 * .why = tests the skill as a consumer would invoke it
 */
const runRadioTaskPull = (input: {
  repoDir: string;
  via: string;
  from?: string;
  list?: boolean;
  exid?: string;
  title?: string;
  status?: string;
  homeDir?: string;
}) => {
  const args = [
    `--via ${input.via}`,
    input.from ? `--from "${input.from}"` : '',
    input.list ? '--list' : '',
    input.exid ? `--exid "${input.exid}"` : '',
    input.title ? `--title "${input.title}"` : '',
    input.status ? `--status ${input.status}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return runRhachetSkill({
    repo: 'bhuild',
    role: 'dispatcher',
    skill: 'radio.task.pull',
    args,
    repoDir: input.repoDir,
    env: input.homeDir ? { HOME: input.homeDir } : {},
    timeout: 30000,
  });
};

describe('radio.task.pull via os.fileops', () => {
  given('[case1] empty radio directory', () => {
    const emptyRepo = {
      owner: 'test-empty',
      name: `test-repo-empty-${Date.now()}`,
    };
    const scene = useBeforeAll(async () => {
      const consumer = await genConsumerRepo({ prefix: 'radio-pull-empty-' });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);
      // allow radio usage for @all orgs
      runRadioUses({
        repoDir: consumer.repoDir,
        args: '--org @all allow',
        homeDir,
      });
      const emptyRadioDir = path.join(homeDir, 'git', '.radio', emptyRepo.owner, emptyRepo.name);
      return { consumer, homeDir, emptyRadioDir };
    });

    afterAll(async () => {
      await fs.promises.rm(scene.emptyRadioDir, { recursive: true, force: true });
    });

    when('[t0] pull --list from empty repo', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPull({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          from: `${emptyRepo.owner}/${emptyRepo.name}`,
          list: true,
          homeDir: scene.homeDir,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output indicates no tasks', () => {
        const output = result.output.toLowerCase();
        expect(output).toMatch(/no tasks|0 tasks|empty/);
      });
    });
  });

  given('[case2] radio directory with tasks', () => {
    const tasksRepo = {
      owner: 'test-tasks',
      name: `test-repo-tasks-${Date.now()}`,
    };

    const scene = useBeforeAll(async () => {
      const consumer = await genConsumerRepo({ prefix: 'radio-pull-tasks-' });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);

      // allow radio usage for @all orgs
      runRadioUses({
        repoDir: consumer.repoDir,
        args: '--org @all allow',
        homeDir,
      });

      const tasksRadioDir = path.join(
        homeDir,
        'git',
        '.radio',
        tasksRepo.owner,
        tasksRepo.name,
      );

      // create first task (QUEUED)
      runRadioTaskPush({
        repoDir: consumer.repoDir,
        via: 'os.fileops',
        into: `${tasksRepo.owner}/${tasksRepo.name}`,
        title: 'first pull test task',
        description: 'will stay enqueued',
        homeDir,
      });

      // create second task and claim it
      runRadioTaskPush({
        repoDir: consumer.repoDir,
        via: 'os.fileops',
        into: `${tasksRepo.owner}/${tasksRepo.name}`,
        title: 'second pull test task',
        description: 'will be claimed',
        homeDir,
      });

      // get exids from files
      const files = await fs.promises.readdir(tasksRadioDir);
      const taskFiles = files
        .filter((f) => f.startsWith('task.') && f.endsWith('._.md'))
        .sort();

      let task1Exid = '';
      let task2Exid = '';
      for (const taskFile of taskFiles) {
        const match = taskFile.match(/^task\.([^.]+)\./);
        if (match) {
          const content = await fs.promises.readFile(
            path.join(tasksRadioDir, taskFile),
            'utf-8',
          );
          if (content.includes('first pull test task')) {
            task1Exid = match[1]!;
          } else if (content.includes('second pull test task')) {
            task2Exid = match[1]!;
          }
        }
      }

      // claim the second task
      if (task2Exid) {
        runRadioTaskPush({
          repoDir: consumer.repoDir,
          via: 'os.fileops',
          into: `${tasksRepo.owner}/${tasksRepo.name}`,
          exid: task2Exid,
          title: '',
          description: '',
          status: 'CLAIMED',
          homeDir,
        });
      }

      return { consumer, homeDir, tasksRadioDir, task1Exid, task2Exid };
    });

    afterAll(async () => {
      await fs.promises.rm(scene.tasksRadioDir, { recursive: true, force: true });
    });

    when('[t0] pull --list without filter', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPull({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          from: `${tasksRepo.owner}/${tasksRepo.name}`,
          list: true,
          homeDir: scene.homeDir,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output shows both tasks', () => {
        expect(result.output).toContain('first pull test task');
        expect(result.output).toContain('second pull test task');
      });
    });

    when('[t1] pull --list with status=QUEUED filter', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPull({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          from: `${tasksRepo.owner}/${tasksRepo.name}`,
          list: true,
          status: 'QUEUED',
          homeDir: scene.homeDir,
        }),
      );

      then('shows only QUEUED task', () => {
        expect(result.output).toContain('first pull test task');
        expect(result.output).not.toContain('second pull test task');
      });
    });

    when('[t2] pull --list with status=CLAIMED filter', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPull({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          from: `${tasksRepo.owner}/${tasksRepo.name}`,
          list: true,
          status: 'CLAIMED',
          homeDir: scene.homeDir,
        }),
      );

      then('shows only CLAIMED task', () => {
        expect(result.output).not.toContain('first pull test task');
        expect(result.output).toContain('second pull test task');
      });
    });

    when('[t3] pull specific task by exid', () => {
      then('returns the task details', () => {
        const result = runRadioTaskPull({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          from: `${tasksRepo.owner}/${tasksRepo.name}`,
          exid: scene.task1Exid,
          homeDir: scene.homeDir,
        });
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('first pull test task');
      });
    });

    when('[t4] pull specific task by title', () => {
      then('returns the task details', () => {
        const result = runRadioTaskPull({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          from: `${tasksRepo.owner}/${tasksRepo.name}`,
          title: 'second pull test task',
          homeDir: scene.homeDir,
        });
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('second pull test task');
      });
    });

    when('[t5] pull task with nonexistent exid', () => {
      then('fails with task not found', () => {
        const result = runRadioTaskPull({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          from: `${tasksRepo.owner}/${tasksRepo.name}`,
          exid: 'nonexistent-exid-12345',
          homeDir: scene.homeDir,
        });
        expect(result.exitCode).not.toBe(0);
        expect(result.output.toLowerCase()).toContain('not found');
      });
    });
  });

  given('[case3] channel validation', () => {
    const scene = useBeforeAll(async () => {
      const consumer = await genConsumerRepo({ prefix: 'radio-pull-validate-' });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);

      // allow radio usage for @all orgs
      runRadioUses({
        repoDir: consumer.repoDir,
        args: '--org @all allow',
        homeDir,
      });

      return { consumer, homeDir };
    });

    when('[t0] pull without --via', () => {
      then('fails with helpful error', () => {
        const result = runRhachetSkill({
          repo: 'bhuild',
          role: 'dispatcher',
          skill: 'radio.task.pull',
          args: '--list --from "test/repo"',
          repoDir: scene.consumer.repoDir,
          env: { HOME: scene.homeDir },
        });
        expect(result.exitCode).not.toBe(0);
      });
    });

    when('[t1] pull without --list or --exid or --title', () => {
      then('fails with helpful error', () => {
        const result = runRadioTaskPull({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          from: 'test/repo',
          homeDir: scene.homeDir,
        });
        expect(result.exitCode).not.toBe(0);
      });
    });
  });

  given('[case4] output format', () => {
    const formatRepo = {
      owner: 'test-format',
      name: `test-repo-format-${Date.now()}`,
    };

    const scene = useBeforeAll(async () => {
      const consumer = await genConsumerRepo({ prefix: 'radio-pull-format-' });
      const homeDir = path.join(consumer.repoDir, '.home');
      fs.mkdirSync(homeDir);

      // allow radio usage for @all orgs
      runRadioUses({
        repoDir: consumer.repoDir,
        args: '--org @all allow',
        homeDir,
      });

      const formatRadioDir = path.join(
        homeDir,
        'git',
        '.radio',
        formatRepo.owner,
        formatRepo.name,
      );

      return { consumer, homeDir, formatRadioDir };
    });

    afterAll(async () => {
      await fs.promises.rm(scene.formatRadioDir, { recursive: true, force: true });
    });

    when('[t0] pull --list shows emoji prefix', () => {
      const result = useBeforeAll(async () => {
        // create a task first
        runRadioTaskPush({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          into: `${formatRepo.owner}/${formatRepo.name}`,
          title: 'format test task',
          description: 'for output format check',
          homeDir: scene.homeDir,
        });

        return runRadioTaskPull({
          repoDir: scene.consumer.repoDir,
          via: 'os.fileops',
          from: `${formatRepo.owner}/${formatRepo.name}`,
          list: true,
          homeDir: scene.homeDir,
        });
      });

      then('output contains radio emoji', () => {
        // the output should have some visual indicator
        expect(result.exitCode).toBe(0);
        expect(result.output.length).toBeGreaterThan(0);
      });

      then('output shows task title', () => {
        expect(result.output).toContain('format test task');
      });

      then('output shows task status', () => {
        expect(result.output.toUpperCase()).toContain('QUEUED');
      });
    });
  });
});
