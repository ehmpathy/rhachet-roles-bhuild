import * as fs from 'fs/promises';
import type { IsoDateStamp } from 'iso-time';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, useBeforeAll, when } from 'test-fns';

import { getDaoRadioTask } from '../../../../access/daos/daoRadioTask';
import { RadioChannel } from '../../../../domain.objects/RadioChannel';
import { RadioTask } from '../../../../domain.objects/RadioTask';
import { RadioTaskRepo } from '../../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../../domain.objects/RadioTaskStatus';
import {
  radioTaskPull,
  radioTaskPullAll,
  radioTaskPullOne,
} from './radioTaskPull';

describe('radioTaskPull via os.fileops', () => {
  // use unique repo per test run
  const testRepo = new RadioTaskRepo({
    owner: 'test-owner',
    name: `test-repo-pull-${Date.now()}`,
  });
  const radioDir = path.join(
    os.homedir(),
    'git',
    '.radio',
    testRepo.owner,
    testRepo.name,
  );
  const dao = getDaoRadioTask({
    channel: RadioChannel.OS_FILEOPS,
    repo: testRepo,
  });

  // cleanup after all tests
  afterAll(async () => {
    await fs.rm(radioDir, { recursive: true, force: true });
  });

  given('[case1] empty radio directory', () => {
    when('[t0] radioTaskPullAll is called', () => {
      then('returns empty array', async () => {
        const result = await radioTaskPullAll({
          via: RadioChannel.OS_FILEOPS,
          repo: testRepo,
        });
        expect(result.tasks).toEqual([]);
      });
    });
  });

  given('[case2] radio directory with tasks', () => {
    const tasksCreated = useBeforeAll(async () => {
      const task1 = new RadioTask({
        exid: 'pull-001',
        title: 'first pull test task',
        description: 'test',
        status: RadioTaskStatus.QUEUED,
        repo: testRepo,
        pushedBy: 'tester',
        pushedAt: '2026-01-30' as IsoDateStamp,
        claimedBy: null,
        claimedAt: null,
        deliveredAt: null,
        branch: null,
      });
      const task2 = new RadioTask({
        exid: 'pull-002',
        title: 'second pull test task',
        description: 'test',
        status: RadioTaskStatus.CLAIMED,
        repo: testRepo,
        pushedBy: 'tester',
        pushedAt: '2026-01-30' as IsoDateStamp,
        claimedBy: 'worker',
        claimedAt: '2026-01-31' as IsoDateStamp,
        deliveredAt: null,
        branch: 'worker/branch',
      });
      const task3 = new RadioTask({
        exid: 'pull-003',
        title: 'third pull test task',
        description: 'test',
        status: RadioTaskStatus.QUEUED,
        repo: testRepo,
        pushedBy: 'tester',
        pushedAt: '2026-01-30' as IsoDateStamp,
        claimedBy: null,
        claimedAt: null,
        deliveredAt: null,
        branch: null,
      });
      await dao.set.findsert({ task: task1 });
      await dao.set.findsert({ task: task2 });
      await dao.set.findsert({ task: task3 });
      return { task1, task2, task3 };
    });

    when('[t0] radioTaskPullAll without filter', () => {
      then('returns all tasks', async () => {
        const result = await radioTaskPullAll({
          via: RadioChannel.OS_FILEOPS,
          repo: testRepo,
        });
        expect(result.tasks.length).toBeGreaterThanOrEqual(3);
        const exids = result.tasks.map((t) => t.exid);
        expect(exids).toContain('pull-001');
        expect(exids).toContain('pull-002');
        expect(exids).toContain('pull-003');
      });
    });

    when('[t1] radioTaskPullAll with status=QUEUED filter', () => {
      then('returns only QUEUED tasks', async () => {
        const result = await radioTaskPullAll({
          via: RadioChannel.OS_FILEOPS,
          repo: testRepo,
          filter: { status: RadioTaskStatus.QUEUED },
        });
        const exids = result.tasks.map((t) => t.exid);
        expect(exids).toContain('pull-001');
        expect(exids).not.toContain('pull-002');
        expect(exids).toContain('pull-003');
      });
    });

    when('[t2] radioTaskPullAll with status=CLAIMED filter', () => {
      then('returns only CLAIMED tasks', async () => {
        const result = await radioTaskPullAll({
          via: RadioChannel.OS_FILEOPS,
          repo: testRepo,
          filter: { status: RadioTaskStatus.CLAIMED },
        });
        const exids = result.tasks.map((t) => t.exid);
        expect(exids).not.toContain('pull-001');
        expect(exids).toContain('pull-002');
        expect(exids).not.toContain('pull-003');
      });
    });

    when('[t3] radioTaskPullOne by exid', () => {
      then('returns the specific task', async () => {
        const result = await radioTaskPullOne({
          via: RadioChannel.OS_FILEOPS,
          repo: testRepo,
          ref: { exid: 'pull-001' },
        });
        expect(result.task.exid).toEqual('pull-001');
        expect(result.task.title).toEqual('first pull test task');
        expect(result.cached).toEqual(false); // same channel, no cache
      });
    });

    when('[t4] radioTaskPullOne by title', () => {
      then('returns the specific task', async () => {
        const result = await radioTaskPullOne({
          via: RadioChannel.OS_FILEOPS,
          repo: testRepo,
          ref: { title: 'second pull test task' },
        });
        expect(result.task.exid).toEqual('pull-002');
        expect(result.task.title).toEqual('second pull test task');
      });
    });

    when('[t5] radioTaskPullOne with nonexistent exid', () => {
      then('throws error: task not found', async () => {
        const error = await getError(
          radioTaskPullOne({
            via: RadioChannel.OS_FILEOPS,
            repo: testRepo,
            ref: { exid: 'nonexistent' },
          }),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('task not found');
      });
    });

    when('[t6] radioTaskPullOne with nonexistent title', () => {
      then('throws error: task not found', async () => {
        const error = await getError(
          radioTaskPullOne({
            via: RadioChannel.OS_FILEOPS,
            repo: testRepo,
            ref: { title: 'nonexistent title' },
          }),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('task not found');
      });
    });
  });

  given('[case3] unified radioTaskPull entry point', () => {
    const taskForUnified = useBeforeAll(async () => {
      const task = new RadioTask({
        exid: 'pull-unified',
        title: 'unified pull test',
        description: 'test',
        status: RadioTaskStatus.QUEUED,
        repo: testRepo,
        pushedBy: 'tester',
        pushedAt: '2026-01-30' as IsoDateStamp,
        claimedBy: null,
        claimedAt: null,
        deliveredAt: null,
        branch: null,
      });
      return dao.set.findsert({ task });
    });

    when('[t0] radioTaskPull with all mode', () => {
      then('returns tasks array', async () => {
        const result = await radioTaskPull({
          via: RadioChannel.OS_FILEOPS,
          repo: testRepo,
          all: {},
        });
        expect('tasks' in result).toBe(true);
        if ('tasks' in result) {
          expect(result.tasks.length).toBeGreaterThan(0);
        }
      });
    });

    when('[t1] radioTaskPull with one mode', () => {
      then('returns single task', async () => {
        const result = await radioTaskPull({
          via: RadioChannel.OS_FILEOPS,
          repo: testRepo,
          one: { exid: taskForUnified.exid },
        });
        expect('task' in result).toBe(true);
        if ('task' in result) {
          expect(result.task.exid).toEqual(taskForUnified.exid);
        }
      });
    });
  });
});
