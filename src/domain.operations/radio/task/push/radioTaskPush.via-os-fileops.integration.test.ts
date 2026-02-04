import * as fs from 'fs/promises';
import type { IsoDateStamp } from 'iso-time';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, useBeforeAll, when } from 'test-fns';

import { getDaoRadioTask } from '../../../../access/daos/daoRadioTask';
import { IdempotencyMode } from '../../../../domain.objects/IdempotencyMode';
import { RadioChannel } from '../../../../domain.objects/RadioChannel';
import { RadioTask } from '../../../../domain.objects/RadioTask';
import { RadioTaskRepo } from '../../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../../domain.objects/RadioTaskStatus';
import { radioTaskPush } from './radioTaskPush';

describe('radioTaskPush via os.fileops', () => {
  // use unique repo per test run
  const testRepo = new RadioTaskRepo({
    owner: 'test-owner',
    name: `test-repo-push-main-${Date.now()}`,
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

  given('[case1] create new task (no exid)', () => {
    when('[t0] radioTaskPush with title and description', () => {
      const result = useBeforeAll(async () => {
        return radioTaskPush({
          via: RadioChannel.OS_FILEOPS,
          task: {
            repo: testRepo,
            title: 'new task via radioTaskPush',
            description: 'test description',
          },
        });
      });

      then('returns outcome=created', () => {
        expect(result.outcome).toEqual('created');
      });

      then('task has exid', () => {
        expect(result.task.exid).toBeDefined();
      });

      then('task has correct title', () => {
        expect(result.task.title).toEqual('new task via radioTaskPush');
      });
    });

    when('[t1] radioTaskPush without title', () => {
      then('throws error: title required', async () => {
        const error = await getError(
          radioTaskPush({
            via: RadioChannel.OS_FILEOPS,
            task: {
              repo: testRepo,
              description: 'no title',
            },
          }),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('--title required');
      });
    });

    when('[t2] radioTaskPush without description', () => {
      then('throws error: description required', async () => {
        const error = await getError(
          radioTaskPush({
            via: RadioChannel.OS_FILEOPS,
            task: {
              repo: testRepo,
              title: 'no description',
            },
          }),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('--description required');
      });
    });
  });

  given('[case2] update task (with exid)', () => {
    const taskCreated = useBeforeAll(async () => {
      const task = new RadioTask({
        exid: 'main-001',
        title: 'task for update via main',
        description: 'original',
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

    when('[t0] radioTaskPush with exid and status', () => {
      then('dispatches to setPartRadioTask', async () => {
        const result = await radioTaskPush({
          via: RadioChannel.OS_FILEOPS,
          task: {
            repo: testRepo,
            exid: taskCreated.exid,
            status: RadioTaskStatus.CLAIMED,
          },
        });
        expect(result.outcome).toEqual('updated');
        expect(result.task.status).toEqual(RadioTaskStatus.CLAIMED);
      });
    });

    when('[t1] radioTaskPush with exid and title update', () => {
      const anotherTask = useBeforeAll(async () => {
        const task = new RadioTask({
          exid: 'main-002',
          title: 'another task for title update',
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

      then('updates the title', async () => {
        const result = await radioTaskPush({
          via: RadioChannel.OS_FILEOPS,
          task: {
            repo: testRepo,
            exid: anotherTask.exid,
            title: 'updated title via main',
          },
        });
        expect(result.outcome).toEqual('updated');
        expect(result.task.title).toEqual('updated title via main');
      });
    });
  });

  given('[case3] idempotency modes', () => {
    when('[t0] findsert mode with duplicate title', () => {
      const firstResult = useBeforeAll(async () => {
        return radioTaskPush({
          via: RadioChannel.OS_FILEOPS,
          idem: IdempotencyMode.FINDSERT,
          task: {
            repo: testRepo,
            title: 'findsert duplicate test',
            description: 'first',
          },
        });
      });

      then('second push returns found', async () => {
        const secondResult = await radioTaskPush({
          via: RadioChannel.OS_FILEOPS,
          idem: IdempotencyMode.FINDSERT,
          task: {
            repo: testRepo,
            title: 'findsert duplicate test',
            description: 'second',
          },
        });
        expect(secondResult.outcome).toEqual('found');
        expect(secondResult.task.exid).toEqual(firstResult.task.exid);
      });
    });

    when('[t1] upsert mode with duplicate title', () => {
      const firstResult = useBeforeAll(async () => {
        return radioTaskPush({
          via: RadioChannel.OS_FILEOPS,
          idem: IdempotencyMode.UPSERT,
          task: {
            repo: testRepo,
            title: 'upsert duplicate test',
            description: 'first',
          },
        });
      });

      then('second push updates description', async () => {
        const secondResult = await radioTaskPush({
          via: RadioChannel.OS_FILEOPS,
          idem: IdempotencyMode.UPSERT,
          task: {
            repo: testRepo,
            title: 'upsert duplicate test',
            description: 'second updated',
          },
        });
        expect(secondResult.outcome).toEqual('created');
        expect(secondResult.task.description).toEqual('second updated');
      });
    });
  });

  given('[case4] bootstraps radio dir', () => {
    const freshRepo = new RadioTaskRepo({
      owner: 'fresh-owner',
      name: `fresh-repo-${Date.now()}`,
    });
    const freshRadioDir = path.join(
      os.homedir(),
      'git',
      '.radio',
      freshRepo.owner,
      freshRepo.name,
    );

    afterAll(async () => {
      await fs.rm(freshRadioDir, { recursive: true, force: true });
    });

    when('[t0] radioTaskPush to fresh repo', () => {
      then('creates radio directory structure', async () => {
        await radioTaskPush({
          via: RadioChannel.OS_FILEOPS,
          task: {
            repo: freshRepo,
            title: 'bootstrap test task',
            description: 'test',
          },
        });

        // verify radio dir exists
        const dirExists = await fs
          .access(freshRadioDir)
          .then(() => true)
          .catch(() => false);
        expect(dirExists).toBe(true);

        // verify readme exists
        const readmeExists = await fs
          .access(path.join(freshRadioDir, 'readme.md'))
          .then(() => true)
          .catch(() => false);
        expect(readmeExists).toBe(true);
      });
    });
  });
});
