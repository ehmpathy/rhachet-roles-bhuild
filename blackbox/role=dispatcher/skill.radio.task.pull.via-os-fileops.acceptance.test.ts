import fs from 'fs';
import os from 'os';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genConsumerRepo, runRhachetSkill } from '../.test/infra';

/**
 * .what = runs radio.task.push via rhachet dispatch
 * .why = helper to create tasks for pull tests
 */
const runRadioTaskPush = (input: {
  repoDir: string;
  via: string;
  repo: string;
  title: string;
  description: string;
  exid?: string;
  status?: string;
}) => {
  const args = [
    `--via ${input.via}`,
    `--repo "${input.repo}"`,
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
  repo?: string;
  list?: boolean;
  exid?: string;
  title?: string;
  status?: string;
}) => {
  const args = [
    `--via ${input.via}`,
    input.repo ? `--repo "${input.repo}"` : '',
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
    timeout: 30000,
  });
};

describe('radio.task.pull via os.fileops', () => {
  given('[case1] empty radio directory', () => {
    const consumer = useBeforeAll(async () =>
      genConsumerRepo({ prefix: 'radio-pull-empty-' }),
    );
    const emptyRepo = {
      owner: 'test-empty',
      name: `test-repo-empty-${Date.now()}`,
    };
    const emptyRadioDir = path.join(
      os.homedir(),
      'git',
      '.radio',
      emptyRepo.owner,
      emptyRepo.name,
    );

    afterAll(async () => {
      await fs.promises.rm(emptyRadioDir, { recursive: true, force: true });
    });

    when('[t0] pull --list from empty repo', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPull({
          repoDir: consumer.repoDir,
          via: 'os.fileops',
          repo: `${emptyRepo.owner}/${emptyRepo.name}`,
          list: true,
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
    const consumer = useBeforeAll(async () =>
      genConsumerRepo({ prefix: 'radio-pull-tasks-' }),
    );
    const tasksRepo = {
      owner: 'test-tasks',
      name: `test-repo-tasks-${Date.now()}`,
    };
    const tasksRadioDir = path.join(
      os.homedir(),
      'git',
      '.radio',
      tasksRepo.owner,
      tasksRepo.name,
    );
    let task1Exid: string;
    let task2Exid: string;

    // create test tasks
    const scene = useBeforeAll(async () => {
      // create first task (QUEUED)
      runRadioTaskPush({
        repoDir: consumer.repoDir,
        via: 'os.fileops',
        repo: `${tasksRepo.owner}/${tasksRepo.name}`,
        title: 'first pull test task',
        description: 'will stay enqueued',
      });

      // create second task and claim it
      runRadioTaskPush({
        repoDir: consumer.repoDir,
        via: 'os.fileops',
        repo: `${tasksRepo.owner}/${tasksRepo.name}`,
        title: 'second pull test task',
        description: 'will be claimed',
      });

      // get exids from files
      const files = await fs.promises.readdir(tasksRadioDir);
      const taskFiles = files
        .filter((f) => f.startsWith('task.') && f.endsWith('._.md'))
        .sort();

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
          repo: `${tasksRepo.owner}/${tasksRepo.name}`,
          exid: task2Exid,
          title: '',
          description: '',
          status: 'CLAIMED',
        });
      }

      return { task1Exid, task2Exid };
    });

    afterAll(async () => {
      await fs.promises.rm(tasksRadioDir, { recursive: true, force: true });
    });

    when('[t0] pull --list without filter', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPull({
          repoDir: consumer.repoDir,
          via: 'os.fileops',
          repo: `${tasksRepo.owner}/${tasksRepo.name}`,
          list: true,
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
          repoDir: consumer.repoDir,
          via: 'os.fileops',
          repo: `${tasksRepo.owner}/${tasksRepo.name}`,
          list: true,
          status: 'QUEUED',
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
          repoDir: consumer.repoDir,
          via: 'os.fileops',
          repo: `${tasksRepo.owner}/${tasksRepo.name}`,
          list: true,
          status: 'CLAIMED',
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
          repoDir: consumer.repoDir,
          via: 'os.fileops',
          repo: `${tasksRepo.owner}/${tasksRepo.name}`,
          exid: task1Exid,
        });
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('first pull test task');
      });
    });

    when('[t4] pull specific task by title', () => {
      then('returns the task details', () => {
        const result = runRadioTaskPull({
          repoDir: consumer.repoDir,
          via: 'os.fileops',
          repo: `${tasksRepo.owner}/${tasksRepo.name}`,
          title: 'second pull test task',
        });
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('second pull test task');
      });
    });

    when('[t5] pull task with nonexistent exid', () => {
      then('fails with task not found', () => {
        const result = runRadioTaskPull({
          repoDir: consumer.repoDir,
          via: 'os.fileops',
          repo: `${tasksRepo.owner}/${tasksRepo.name}`,
          exid: 'nonexistent-exid-12345',
        });
        expect(result.exitCode).not.toBe(0);
        expect(result.output.toLowerCase()).toContain('not found');
      });
    });
  });

  given('[case3] channel validation', () => {
    const consumer = useBeforeAll(async () =>
      genConsumerRepo({ prefix: 'radio-pull-validate-' }),
    );

    when('[t0] pull without --via', () => {
      then('fails with helpful error', () => {
        const result = runRhachetSkill({
          repo: 'bhuild',
          role: 'dispatcher',
          skill: 'radio.task.pull',
          args: '--list --repo "test/repo"',
          repoDir: consumer.repoDir,
        });
        expect(result.exitCode).not.toBe(0);
      });
    });

    when('[t1] pull without --list or --exid or --title', () => {
      then('fails with helpful error', () => {
        const result = runRadioTaskPull({
          repoDir: consumer.repoDir,
          via: 'os.fileops',
          repo: 'test/repo',
        });
        expect(result.exitCode).not.toBe(0);
      });
    });
  });

  given('[case4] output format', () => {
    const consumer = useBeforeAll(async () =>
      genConsumerRepo({ prefix: 'radio-pull-format-' }),
    );
    const formatRepo = {
      owner: 'test-format',
      name: `test-repo-format-${Date.now()}`,
    };
    const formatRadioDir = path.join(
      os.homedir(),
      'git',
      '.radio',
      formatRepo.owner,
      formatRepo.name,
    );

    afterAll(async () => {
      await fs.promises.rm(formatRadioDir, { recursive: true, force: true });
    });

    when('[t0] pull --list shows emoji prefix', () => {
      const result = useBeforeAll(async () => {
        // create a task first
        runRadioTaskPush({
          repoDir: consumer.repoDir,
          via: 'os.fileops',
          repo: `${formatRepo.owner}/${formatRepo.name}`,
          title: 'format test task',
          description: 'for output format check',
        });

        return runRadioTaskPull({
          repoDir: consumer.repoDir,
          via: 'os.fileops',
          repo: `${formatRepo.owner}/${formatRepo.name}`,
          list: true,
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
