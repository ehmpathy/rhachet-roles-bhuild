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
import { setPartRadioTask } from './setPartRadioTask';

describe('setPartRadioTask via os.fileops', () => {
  // use unique repo per test run
  const testRepo = new RadioTaskRepo({
    owner: 'test-owner',
    name: `test-repo-push-part-${Date.now()}`,
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

  given('[case1] task in QUEUED status', () => {
    const taskCreated = useBeforeAll(async () => {
      const task = new RadioTask({
        exid: 'part-001',
        title: 'task for status transition',
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
      return dao.set.findsert({ task });
    });

    when('[t0] status updated to CLAIMED', () => {
      then('task is claimed with branch and actor', async () => {
        const result = await setPartRadioTask({
          via: RadioChannel.OS_FILEOPS,
          task: {
            repo: testRepo,
            exid: taskCreated.exid,
            status: RadioTaskStatus.CLAIMED,
          },
        });
        expect(result.outcome).toEqual('updated');
        expect(result.task.status).toEqual(RadioTaskStatus.CLAIMED);
        expect(result.task.claimedBy).toBeDefined();
        expect(result.task.claimedAt).toBeDefined();
        expect(result.task.branch).toBeDefined();
      });
    });

    when('[t1] attempt to deliver unclaimed task', () => {
      const freshTask = useBeforeAll(async () => {
        const task = new RadioTask({
          exid: 'part-002',
          title: 'unclaimed task for delivery test',
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

      then('throws error: cannot deliver unclaimed task', async () => {
        const error = await getError(
          setPartRadioTask({
            via: RadioChannel.OS_FILEOPS,
            task: {
              repo: testRepo,
              exid: freshTask.exid,
              status: RadioTaskStatus.DELIVERED,
            },
          }),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('cannot deliver unclaimed task');
      });
    });
  });

  given('[case2] task in CLAIMED status', () => {
    const claimedTask = useBeforeAll(async () => {
      const task = new RadioTask({
        exid: 'part-003',
        title: 'claimed task for delivery',
        description: 'test',
        status: RadioTaskStatus.CLAIMED,
        repo: testRepo,
        pushedBy: 'tester',
        pushedAt: '2026-01-30' as IsoDateStamp,
        claimedBy: 'worker',
        claimedAt: '2026-01-31' as IsoDateStamp,
        deliveredAt: null,
        branch: 'worker/test-branch',
      });
      return dao.set.findsert({ task });
    });

    when('[t0] status updated to DELIVERED', () => {
      then('task is delivered with deliveredAt', async () => {
        const result = await setPartRadioTask({
          via: RadioChannel.OS_FILEOPS,
          task: {
            repo: testRepo,
            exid: claimedTask.exid,
            status: RadioTaskStatus.DELIVERED,
          },
        });
        expect(result.outcome).toEqual('updated');
        expect(result.task.status).toEqual(RadioTaskStatus.DELIVERED);
        expect(result.task.deliveredAt).toBeDefined();
      });
    });
  });

  given('[case3] update title and description', () => {
    const taskToEdit = useBeforeAll(async () => {
      const task = new RadioTask({
        exid: 'part-004',
        title: 'original title',
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
      return dao.set.findsert({ task });
    });

    when('[t0] title is updated', () => {
      then('task has new title', async () => {
        const result = await setPartRadioTask({
          via: RadioChannel.OS_FILEOPS,
          task: {
            repo: testRepo,
            exid: taskToEdit.exid,
            title: 'updated title',
          },
        });
        expect(result.outcome).toEqual('updated');
        expect(result.task.title).toEqual('updated title');
      });
    });

    when('[t1] description is updated', () => {
      then('task has new description', async () => {
        const result = await setPartRadioTask({
          via: RadioChannel.OS_FILEOPS,
          task: {
            repo: testRepo,
            exid: taskToEdit.exid,
            description: 'updated description',
          },
        });
        expect(result.outcome).toEqual('updated');
        expect(result.task.description).toEqual('updated description');
      });
    });
  });

  given('[case4] task not found', () => {
    when('[t0] setPartRadioTask with nonexistent exid', () => {
      then('throws error: task not found', async () => {
        const error = await getError(
          setPartRadioTask({
            via: RadioChannel.OS_FILEOPS,
            task: {
              repo: testRepo,
              exid: 'nonexistent-exid',
              status: RadioTaskStatus.CLAIMED,
            },
          }),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('task not found');
      });
    });
  });

  given('[case5] no changes provided', () => {
    const unchangedTask = useBeforeAll(async () => {
      const task = new RadioTask({
        exid: 'part-005',
        title: 'unchanged task',
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

    when('[t0] setPartRadioTask with no changes', () => {
      then('returns outcome=unchanged', async () => {
        const result = await setPartRadioTask({
          via: RadioChannel.OS_FILEOPS,
          task: {
            repo: testRepo,
            exid: unchangedTask.exid,
          },
        });
        expect(result.outcome).toEqual('unchanged');
        expect(result.task.exid).toEqual(unchangedTask.exid);
      });
    });
  });
});
