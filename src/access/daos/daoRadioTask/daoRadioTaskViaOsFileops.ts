import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import type { IsoDateStamp } from 'iso-time';
import * as os from 'os';
import * as path from 'path';

import { RadioTask } from '../../../domain.objects/RadioTask';
import type { RadioTaskRepo } from '../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../domain.objects/RadioTaskStatus';
import { composeTaskIntoOsFileops } from '../../../domain.operations/radio/task/format/composeTaskIntoOsFileops';
import { extractTaskFromOsFileops } from '../../../domain.operations/radio/task/format/extractTaskFromOsFileops';
import type { DaoRadioTask } from './index';

/**
 * .what = generate a short unique id
 * .why = create exid for new tasks
 */
const genShortId = (): string => {
  return crypto.randomUUID().slice(0, 8);
};

/**
 * .what = convert Date to IsoDateStamp
 * .why = format date for RadioTask fields
 */
const toIsoDateStamp = (date: Date): IsoDateStamp => {
  return date.toISOString().split('T')[0] as IsoDateStamp;
};

/**
 * .what = compute global radio directory path for a repo
 * .why = consistent path resolution for task storage
 */
const getGlobalRadioDir = (repo: RadioTaskRepo): string => {
  return path.join(os.homedir(), 'git', '.radio', repo.owner, repo.name);
};

/**
 * .what = compute task file path from exid
 * .why = consistent file name for task storage
 */
const getTaskFilePath = (radioDir: string, exid: string): string => {
  return path.join(radioDir, `task.${exid}._.md`);
};

/**
 * .what = compute status flag file path
 * .why = enables fast status queries via glob
 */
const getStatusFlagPath = (
  radioDir: string,
  exid: string,
  status: RadioTaskStatus,
): string => {
  return path.join(radioDir, `task.${exid}._.status=${status}.flag`);
};

/**
 * .what = compute backup file path with iso timestamp
 * .why = preserves prior versions on edit
 */
const getBackupFilePath = (radioDir: string, exid: string): string => {
  const isoNow = toIsoDateStamp(new Date());
  return path.join(radioDir, `task.${exid}.bak.${isoNow}.md`);
};

/**
 * .what = check if a path exists
 * .why = helper for file existence checks
 */
const pathExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * .what = ensure directory exists
 * .why = bootstrap radio directory structure
 */
const ensureDir = async (dirPath: string): Promise<void> => {
  await fs.mkdir(dirPath, { recursive: true });
};

/**
 * .what = remove all status flag files for a task
 * .why = clean up before set of new status
 */
const removeStatusFlags = async (
  radioDir: string,
  exid: string,
): Promise<void> => {
  for (const status of Object.values(RadioTaskStatus)) {
    const flagPath = getStatusFlagPath(radioDir, exid, status);
    if (await pathExists(flagPath)) {
      await fs.rm(flagPath);
    }
  }
};

/**
 * .what = dao adapter for local filesystem channel
 * .why = enables radio task persistence via filesystem for offline access
 */
export const daoRadioTaskViaOsFileops = (context: {
  repo: RadioTaskRepo;
}): DaoRadioTask => {
  const radioDir = getGlobalRadioDir(context.repo);

  return {
    get: {
      one: {
        byPrimary: async ({ exid }) => {
          const filePath = getTaskFilePath(radioDir, exid);
          if (!(await pathExists(filePath))) return null;

          const content = await fs.readFile(filePath, 'utf-8');
          return extractTaskFromOsFileops({ content });
        },

        byUnique: async ({ repo, title }) => {
          // list all task files and find by title
          if (!(await pathExists(radioDir))) return null;

          const files = await fs.readdir(radioDir);
          const taskFiles = files.filter(
            (f) => f.startsWith('task.') && f.endsWith('._.md'),
          );

          for (const file of taskFiles) {
            const filePath = path.join(radioDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const task = extractTaskFromOsFileops({ content });
            if (task.title === title) return task;
          }

          return null;
        },
      },

      all: async ({ repo, filter, limit = 100 }) => {
        if (!(await pathExists(radioDir))) return [];

        const files = await fs.readdir(radioDir);

        // if filter by status, use flag files for fast query
        if (filter?.status) {
          const flagPattern = `._.status=${filter.status}.flag`;
          const flagFiles = files.filter((f) => f.endsWith(flagPattern));

          const tasks: RadioTask[] = [];
          for (const flagFile of flagFiles.slice(0, limit)) {
            const exid = flagFile.replace('task.', '').replace(flagPattern, '');
            const filePath = getTaskFilePath(radioDir, exid);
            if (await pathExists(filePath)) {
              const content = await fs.readFile(filePath, 'utf-8');
              tasks.push(extractTaskFromOsFileops({ content }));
            }
          }
          return tasks;
        }

        // no filter, read all task files
        const taskFiles = files.filter(
          (f) => f.startsWith('task.') && f.endsWith('._.md'),
        );

        const tasks: RadioTask[] = [];
        for (const file of taskFiles.slice(0, limit)) {
          const filePath = path.join(radioDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          tasks.push(extractTaskFromOsFileops({ content }));
        }
        return tasks;
      },
    },

    set: {
      findsert: async ({ task }) => {
        // check if task already exists
        const taskFound = await daoRadioTaskViaOsFileops(
          context,
        ).get.one.byUnique({
          repo: task.repo,
          title: task.title,
        });
        if (taskFound) return taskFound;

        // ensure directory exists
        await ensureDir(radioDir);

        // generate exid if not provided
        const exid = task.exid || genShortId();
        const taskWithExid = new RadioTask({ ...task, exid });

        // write task file
        const filePath = getTaskFilePath(radioDir, exid);
        const content = composeTaskIntoOsFileops({ task: taskWithExid });
        await fs.writeFile(filePath, content, 'utf-8');

        // write status flag
        if (taskWithExid.status !== RadioTaskStatus.DELIVERED) {
          const flagPath = getStatusFlagPath(
            radioDir,
            exid,
            taskWithExid.status,
          );
          await fs.writeFile(flagPath, '', 'utf-8');
        }

        return taskWithExid;
      },

      upsert: async ({ task }) => {
        // check if task exists
        const taskFound = task.exid
          ? await daoRadioTaskViaOsFileops(context).get.one.byPrimary({
              exid: task.exid,
            })
          : await daoRadioTaskViaOsFileops(context).get.one.byUnique({
              repo: task.repo,
              title: task.title,
            });

        if (!taskFound) {
          // create new task
          return daoRadioTaskViaOsFileops(context).set.findsert({ task });
        }

        // ensure directory exists
        await ensureDir(radioDir);

        const exid = taskFound.exid;

        // create backup before overwrite
        const taskFilePath = getTaskFilePath(radioDir, exid);
        if (await pathExists(taskFilePath)) {
          const backupPath = getBackupFilePath(radioDir, exid);
          await fs.copyFile(taskFilePath, backupPath);
        }

        // merge with found task
        const taskMerged = new RadioTask({
          ...taskFound,
          ...task,
          exid,
        });

        // write task file
        const content = composeTaskIntoOsFileops({ task: taskMerged });
        await fs.writeFile(taskFilePath, content, 'utf-8');

        // update status flag
        await removeStatusFlags(radioDir, exid);
        if (taskMerged.status !== RadioTaskStatus.DELIVERED) {
          const flagPath = getStatusFlagPath(radioDir, exid, taskMerged.status);
          await fs.writeFile(flagPath, '', 'utf-8');
        }

        return taskMerged;
      },
    },

    del: async ({ exid }) => {
      const filePath = getTaskFilePath(radioDir, exid);
      if (await pathExists(filePath)) {
        await fs.rm(filePath);
      }
      await removeStatusFlags(radioDir, exid);
    },
  };
};
