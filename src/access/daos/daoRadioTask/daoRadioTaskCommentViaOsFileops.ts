import * as fs from 'fs/promises';

import type { RadioTaskRepo } from '../../../domain.objects/RadioTaskRepo';
import { isCommentBodyAmong } from '../../../domain.operations/radio/task/comment/isCommentBodyAmong';
import { asCommentBodiesFromLog } from './asCommentBodiesFromLog';
import { getOsFileopsCommentLogPath } from './getOsFileopsCommentLogPath';
import { getOsFileopsRadioDir } from './getOsFileopsRadioDir';
import { getOsFileopsTaskFilePath } from './getOsFileopsTaskFilePath';

/**
 * .what = the text of a file, or null when it is absent
 * .why = an absent task file or log is a fact to branch on; any other read fault fails loud
 */
const getFileTextOrNull = async (input: {
  path: string;
}): Promise<string | null> => {
  try {
    return await fs.readFile(input.path, 'utf-8');
  } catch (error: unknown) {
    // only an absent file is allowlisted; node fs errors carry a code field. the check is
    // structural, since an fs error from another realm (a jest vm) fails `instanceof Error`
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    )
      return null;
    throw error;
  }
};

/**
 * .what = dao for comments on os.fileops tasks
 * .why = the offline twin of a gh issue comment: an entry appended to a log beside the task
 */
export const daoRadioTaskCommentViaOsFileops = {
  set: {
    /**
     * .what = find the exact body in the task's comment log, else append it
     * .why = a later run of the same body must never append it twice
     * .note = null when no such task file exists; the task file itself is never touched
     * .note = the read and the append are two calls. within one worktree the drain lock admits
     *         one send at a time; two worktrees that send one body in the same instant may both
     *         append it. that race is accepted as it is for gh.issues (F7): the cost is one
     *         duplicate line, and a lock across worktrees would gate every comment on a shared
     *         file for a case two clones must time to the instant
     */
    findsert: async (input: {
      repo: RadioTaskRepo;
      exid: string;
      body: string;
    }): Promise<{ url: string | null; outcome: 'posted' | 'kept' } | null> => {
      // the task must exist
      const radioDir = getOsFileopsRadioDir({ repo: input.repo });
      const taskText = await getFileTextOrNull({
        path: getOsFileopsTaskFilePath({ radioDir, exid: input.exid }),
      });
      if (taskText === null) return null;

      // the body may already be in the log
      const logPath = getOsFileopsCommentLogPath({
        radioDir,
        exid: input.exid,
      });
      const logText = await getFileTextOrNull({ path: logPath });
      const bodies = asCommentBodiesFromLog({
        text: logText ?? '',
        path: logPath,
      });
      if (isCommentBodyAmong({ bodies, body: input.body }))
        return { url: null, outcome: 'kept' };

      // append one entry
      await fs.appendFile(
        logPath,
        `${JSON.stringify({ body: input.body })}\n`,
        'utf-8',
      );
      return { url: null, outcome: 'posted' };
    },
  },
};
