import * as fs from 'fs/promises';
import type { IsoDateStamp } from 'iso-time';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import type { ContextGitRepo } from '../../../domain.objects/RadioContext';
import { RadioTask } from '../../../domain.objects/RadioTask';
import { RadioTaskRepo } from '../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../domain.objects/RadioTaskStatus';
import { daoRadioTaskCommentViaOsFileops } from './daoRadioTaskCommentViaOsFileops';
import { daoRadioTaskViaOsFileops } from './daoRadioTaskViaOsFileops';
import { getOsFileopsRadioDir } from './getOsFileopsRadioDir';
import { getOsFileopsTaskFilePath } from './getOsFileopsTaskFilePath';

describe('daoRadioTaskCommentViaOsFileops', () => {
  // a unique repo per run, so runs never collide in the shared home store
  const repo = new RadioTaskRepo({
    owner: 'sandpine',
    name: `comment-dao-${Date.now()}`,
  });
  const radioDir = getOsFileopsRadioDir({ repo });
  const context: ContextGitRepo = { git: { repo } };

  afterAll(async () => {
    await fs.rm(radioDir, { recursive: true, force: true });
  });

  /**
   * .what = the bodies a task's comment log holds, or [] when no log exists
   */
  const getLogBodies = async (input: { exid: string }): Promise<string[]> => {
    const log = path.join(radioDir, `task.${input.exid}.comments.jsonl`);
    const text = await fs.readFile(log, 'utf-8').catch((error: unknown) => {
      if ((error as { code?: string })?.code === 'ENOENT') return ''; // note: node fs errors carry a code field; only an absent log is allowlisted
      throw error;
    });
    return text
      .split('\n')
      .filter(Boolean)
      .map((line) => (JSON.parse(line) as { body: string }).body);
  };

  given('[case1] a task file exists', () => {
    const scene = useBeforeAll(async () => {
      const task = await daoRadioTaskViaOsFileops.set.findsert(
        {
          task: new RadioTask({
            exid: '',
            title: 'wax the rental boards',
            description: 'all twelve',
            status: RadioTaskStatus.QUEUED,
            repo,
            pushedAt: '2026-11-14' as IsoDateStamp,
            pushedBy: 'bert',
            claimedAt: null,
            claimedBy: null,
            deliveredAt: null,
            branch: null,
          }),
        },
        context,
      );
      const taskFile = getOsFileopsTaskFilePath({ radioDir, exid: task.exid });
      const taskBefore = await fs.readFile(taskFile, 'utf-8');
      return { exid: task.exid, taskFile, taskBefore };
    });

    when('[t0] a body is commented', () => {
      const result = useBeforeAll(async () => ({
        found: await daoRadioTaskCommentViaOsFileops.set.findsert({
          repo,
          exid: scene.exid,
          body: 'board 7 needs a new fin\nand a wax',
        }),
      }));

      then('it reads posted, with no url', () => {
        expect(result.found).toEqual({ url: null, outcome: 'posted' });
      });

      then('the log holds the body, newlines literal', async () => {
        expect(await getLogBodies({ exid: scene.exid })).toEqual([
          'board 7 needs a new fin\nand a wax',
        ]);
      });

      then('the task file is byte for byte unchanged', async () => {
        expect(await fs.readFile(scene.taskFile, 'utf-8')).toEqual(
          scene.taskBefore,
        );
      });
    });

    when(
      '[t1] the same body is commented again, with a trailed newline',
      () => {
        const result = useBeforeAll(async () => ({
          found: await daoRadioTaskCommentViaOsFileops.set.findsert({
            repo,
            exid: scene.exid,
            body: 'board 7 needs a new fin\nand a wax\n',
          }),
        }));

        then('it reads kept, and the log still holds one entry', async () => {
          expect(result.found).toEqual({ url: null, outcome: 'kept' });
          expect(await getLogBodies({ exid: scene.exid })).toHaveLength(1);
        });
      },
    );

    when('[t2] a different body is commented', () => {
      const result = useBeforeAll(async () => ({
        found: await daoRadioTaskCommentViaOsFileops.set.findsert({
          repo,
          exid: scene.exid,
          body: 'board 9 is dinged too',
        }),
      }));

      then(
        'it reads posted, and the log holds both, oldest first',
        async () => {
          expect(result.found?.outcome).toEqual('posted');
          expect(await getLogBodies({ exid: scene.exid })).toEqual([
            'board 7 needs a new fin\nand a wax',
            'board 9 is dinged too',
          ]);
        },
      );
    });

    when('[t3] the task scan reads the store after the comments', () => {
      const result = useBeforeAll(async () => ({
        tasks: await daoRadioTaskViaOsFileops.get.all({ repo }, context),
      }));

      then('the log is never read as a task', () => {
        expect(result.tasks.map((task) => task.exid)).toEqual([scene.exid]);
      });
    });
  });

  given('[case2] no task file exists for the exid', () => {
    when('[t0] a body is commented', () => {
      const result = useBeforeAll(async () => ({
        found: await daoRadioTaskCommentViaOsFileops.set.findsert({
          repo,
          exid: 'no-such-task',
          body: 'hello',
        }),
      }));

      then('it returns null, and no log is created', async () => {
        expect(result.found).toBeNull();
        expect(await getLogBodies({ exid: 'no-such-task' })).toEqual([]);
        const files = await fs.readdir(radioDir);
        expect(files).not.toContain('task.no-such-task.comments.jsonl');
      });
    });
  });
});
