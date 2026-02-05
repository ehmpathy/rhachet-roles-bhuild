import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import type { ContextGitRepo } from '../../../../access/daos/daoRadioTask';
import { IdempotencyMode } from '../../../../domain.objects/IdempotencyMode';
import { RadioChannel } from '../../../../domain.objects/RadioChannel';
import { RadioTaskRepo } from '../../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../../domain.objects/RadioTaskStatus';
import { setFullRadioTask } from './setFullRadioTask';

describe('setFullRadioTask via os.fileops', () => {
  // use unique repo per test run
  const testRepo = new RadioTaskRepo({
    owner: 'test-owner',
    name: `test-repo-push-full-${Date.now()}`,
  });
  const radioDir = path.join(
    os.homedir(),
    'git',
    '.radio',
    testRepo.owner,
    testRepo.name,
  );

  // context for domain operation calls
  const context: ContextGitRepo = { git: { repo: testRepo } };

  // cleanup after all tests
  afterAll(async () => {
    await fs.rm(radioDir, { recursive: true, force: true });
  });

  given('[case1] new task with findsert (default)', () => {
    when('[t0] setFullRadioTask is called', () => {
      const result = useBeforeAll(async () => {
        return setFullRadioTask(
          {
            via: RadioChannel.OS_FILEOPS,
            task: {
              repo: testRepo,
              title: 'test findsert task',
              description: 'test description for findsert',
            },
          },
          context,
        );
      });

      then('returns task with exid', () => {
        expect(result.task.exid).toBeDefined();
        expect(result.task.exid.length).toEqual(8);
      });

      then('returns outcome=created', () => {
        expect(result.outcome).toEqual('created');
      });

      then('task has correct title', () => {
        expect(result.task.title).toEqual('test findsert task');
      });

      then('task has correct description', () => {
        expect(result.task.description).toEqual(
          'test description for findsert',
        );
      });

      then('task has QUEUED status', () => {
        expect(result.task.status).toEqual(RadioTaskStatus.QUEUED);
      });

      then('task has pushedBy', () => {
        expect(result.task.pushedBy).toBeDefined();
      });

      then('task has pushedAt', () => {
        expect(result.task.pushedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      then('task file exists on disk', async () => {
        const filePath = path.join(radioDir, `task.${result.task.exid}._.md`);
        const exists = await fs
          .access(filePath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });
    });

    when('[t1] same task is pushed again (findsert mode)', () => {
      const firstResult = useBeforeAll(async () => {
        return setFullRadioTask(
          {
            via: RadioChannel.OS_FILEOPS,
            task: {
              repo: testRepo,
              title: 'duplicate findsert task',
              description: 'first description',
            },
          },
          context,
        );
      });

      then('second push returns outcome=found', async () => {
        const secondResult = await setFullRadioTask(
          {
            via: RadioChannel.OS_FILEOPS,
            idem: IdempotencyMode.FINDSERT,
            task: {
              repo: testRepo,
              title: 'duplicate findsert task',
              description: 'different description',
            },
          },
          context,
        );
        expect(secondResult.outcome).toEqual('found');
        expect(secondResult.task.exid).toEqual(firstResult.task.exid);
      });
    });
  });

  given('[case2] new task with upsert', () => {
    when('[t0] setFullRadioTask with upsert mode', () => {
      const result = useBeforeAll(async () => {
        return setFullRadioTask(
          {
            via: RadioChannel.OS_FILEOPS,
            idem: IdempotencyMode.UPSERT,
            task: {
              repo: testRepo,
              title: 'test upsert task',
              description: 'original upsert description',
            },
          },
          context,
        );
      });

      then('returns task with exid', () => {
        expect(result.task.exid).toBeDefined();
      });

      then('returns outcome=created', () => {
        expect(result.outcome).toEqual('created');
      });
    });

    when('[t1] same task pushed again with upsert', () => {
      const firstResult = useBeforeAll(async () => {
        return setFullRadioTask(
          {
            via: RadioChannel.OS_FILEOPS,
            idem: IdempotencyMode.UPSERT,
            task: {
              repo: testRepo,
              title: 'duplicate upsert task',
              description: 'first upsert description',
            },
          },
          context,
        );
      });

      then('second push with upsert updates the task', async () => {
        const secondResult = await setFullRadioTask(
          {
            via: RadioChannel.OS_FILEOPS,
            idem: IdempotencyMode.UPSERT,
            task: {
              repo: testRepo,
              title: 'duplicate upsert task',
              description: 'updated upsert description',
            },
          },
          context,
        );
        expect(secondResult.outcome).toEqual('created');
        expect(secondResult.task.description).toEqual(
          'updated upsert description',
        );
      });
    });
  });
});
