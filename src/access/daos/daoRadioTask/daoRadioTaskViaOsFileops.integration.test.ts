import * as fs from 'fs/promises';
import type { IsoDateStamp } from 'iso-time';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { RadioTask } from '../../../domain.objects/RadioTask';
import { RadioTaskRepo } from '../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../domain.objects/RadioTaskStatus';
import { daoRadioTaskViaOsFileops } from './daoRadioTaskViaOsFileops';

describe('daoRadioTaskViaOsFileops', () => {
  // use unique repo per test run to avoid collisions
  const testRepo = new RadioTaskRepo({
    owner: 'test-owner',
    name: `test-repo-${Date.now()}`,
  });
  const radioDir = path.join(
    os.homedir(),
    'git',
    '.radio',
    testRepo.owner,
    testRepo.name,
  );
  const dao = daoRadioTaskViaOsFileops({ repo: testRepo });

  // cleanup after all tests
  afterAll(async () => {
    await fs.rm(radioDir, { recursive: true, force: true });
  });

  given('[case1] empty radio directory', () => {
    when('[t0] get.one.byPrimary for nonexistent task', () => {
      then('returns null', async () => {
        const result = await dao.get.one.byPrimary({ exid: 'nonexistent' });
        expect(result).toBeNull();
      });
    });

    when('[t1] get.one.byUnique for nonexistent task', () => {
      then('returns null', async () => {
        const result = await dao.get.one.byUnique({
          repo: testRepo,
          title: 'nonexistent',
        });
        expect(result).toBeNull();
      });
    });

    when('[t2] get.all on empty directory', () => {
      then('returns empty array', async () => {
        const result = await dao.get.all({ repo: testRepo });
        expect(result).toEqual([]);
      });
    });
  });

  given('[case2] findsert a new task', () => {
    const taskToCreate = new RadioTask({
      exid: 'test-001',
      title: 'test task for findsert',
      description: 'test description',
      status: RadioTaskStatus.QUEUED,
      repo: testRepo,
      pushedBy: 'tester',
      pushedAt: '2026-01-30' as IsoDateStamp,
      claimedBy: null,
      claimedAt: null,
      deliveredAt: null,
      branch: null,
    });

    when('[t0] findsert is called', () => {
      const taskCreated = useBeforeAll(async () => {
        return dao.set.findsert({ task: taskToCreate });
      });

      then('returns task with exid', () => {
        expect(taskCreated.exid).toEqual('test-001');
      });

      then('task file exists on disk', async () => {
        const filePath = path.join(radioDir, 'task.test-001._.md');
        const exists = await fs
          .access(filePath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });

      then('status flag file exists', async () => {
        const flagPath = path.join(
          radioDir,
          'task.test-001._.status=QUEUED.flag',
        );
        const exists = await fs
          .access(flagPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });
    });

    when('[t1] findsert same task again', () => {
      then('returns found task (idempotent)', async () => {
        const result = await dao.set.findsert({ task: taskToCreate });
        expect(result.exid).toEqual('test-001');
        expect(result.title).toEqual('test task for findsert');
      });
    });

    when('[t2] get.one.byPrimary for created task', () => {
      then('returns the task', async () => {
        const result = await dao.get.one.byPrimary({ exid: 'test-001' });
        expect(result).not.toBeNull();
        expect(result?.title).toEqual('test task for findsert');
      });
    });

    when('[t3] get.one.byUnique for created task', () => {
      then('returns the task', async () => {
        const result = await dao.get.one.byUnique({
          repo: testRepo,
          title: 'test task for findsert',
        });
        expect(result).not.toBeNull();
        expect(result?.exid).toEqual('test-001');
      });
    });
  });

  given('[case3] upsert to update a task', () => {
    const taskToCreate = new RadioTask({
      exid: 'test-002',
      title: 'test task for upsert',
      description: 'original description',
      status: RadioTaskStatus.QUEUED,
      repo: testRepo,
      pushedBy: 'tester',
      pushedAt: '2026-01-30' as IsoDateStamp,
      claimedBy: null,
      claimedAt: null,
      deliveredAt: null,
      branch: null,
    });

    const taskCreated = useBeforeAll(async () => {
      return dao.set.findsert({ task: taskToCreate });
    });

    when('[t0] upsert with updated status', () => {
      then('task is updated', async () => {
        const taskToUpdate = new RadioTask({
          ...taskCreated,
          status: RadioTaskStatus.CLAIMED,
          claimedBy: 'worker',
          claimedAt: '2026-01-31' as IsoDateStamp,
          branch: 'worker/test-branch',
        });

        const updated = await dao.set.upsert({ task: taskToUpdate });
        expect(updated.status).toEqual(RadioTaskStatus.CLAIMED);
        expect(updated.claimedBy).toEqual('worker');
        expect(updated.branch).toEqual('worker/test-branch');
      });
    });

    when('[t1] check backup file created', () => {
      then('backup file exists', async () => {
        const files = await fs.readdir(radioDir);
        const backupFiles = files.filter((f) =>
          f.startsWith('task.test-002.bak.'),
        );
        expect(backupFiles.length).toBeGreaterThan(0);
      });
    });

    when('[t2] status flag is updated', () => {
      then('CLAIMED flag exists', async () => {
        const flagPath = path.join(
          radioDir,
          'task.test-002._.status=CLAIMED.flag',
        );
        const exists = await fs
          .access(flagPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });

      then('QUEUED flag is removed', async () => {
        const flagPath = path.join(
          radioDir,
          'task.test-002._.status=QUEUED.flag',
        );
        const exists = await fs
          .access(flagPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      });
    });
  });

  given('[case4] get.all with status filter', () => {
    const taskEnqueued = new RadioTask({
      exid: 'test-003',
      title: 'enqueued task for filter',
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

    const taskClaimed = new RadioTask({
      exid: 'test-004',
      title: 'claimed task for filter',
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

    useBeforeAll(async () => {
      const t1 = await dao.set.findsert({ task: taskEnqueued });
      const t2 = await dao.set.findsert({ task: taskClaimed });
      return { t1, t2 };
    });

    when('[t0] get.all with status=QUEUED', () => {
      then('returns only QUEUED tasks', async () => {
        const result = await dao.get.all({
          repo: testRepo,
          filter: { status: RadioTaskStatus.QUEUED },
        });
        const exids = result.map((t) => t.exid);
        expect(exids).toContain('test-003');
        expect(exids).not.toContain('test-004');
      });
    });

    when('[t1] get.all with status=CLAIMED', () => {
      then('returns only CLAIMED tasks', async () => {
        const result = await dao.get.all({
          repo: testRepo,
          filter: { status: RadioTaskStatus.CLAIMED },
        });
        const exids = result.map((t) => t.exid);
        expect(exids).toContain('test-004');
        // test-002 was also claimed in case3
        expect(exids).toContain('test-002');
      });
    });
  });

  given('[case5] del a task', () => {
    const taskToDelete = new RadioTask({
      exid: 'test-005',
      title: 'task to delete',
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

    useBeforeAll(async () => {
      const task = await dao.set.findsert({ task: taskToDelete });
      return { task };
    });

    when('[t0] del is called', () => {
      then('task is removed', async () => {
        await dao.del({ exid: 'test-005' });
        const result = await dao.get.one.byPrimary({ exid: 'test-005' });
        expect(result).toBeNull();
      });
    });

    when('[t1] task file is removed', () => {
      then('file no longer exists', async () => {
        const filePath = path.join(radioDir, 'task.test-005._.md');
        const exists = await fs
          .access(filePath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      });
    });

    when('[t2] status flag is removed', () => {
      then('flag no longer exists', async () => {
        const flagPath = path.join(
          radioDir,
          'task.test-005._.status=QUEUED.flag',
        );
        const exists = await fs
          .access(flagPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      });
    });
  });
});
