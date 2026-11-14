import * as path from 'path';

import { asOsFileopsPathSegment } from './asOsFileopsPathSegment';

/**
 * .what = the comment log path for a task: `task.<exid>.comments.jsonl`, beside its task file
 * .why = a comment never enters the task file, whose parser reads trailed text as description;
 *        the name ends apart from `._.md`, so no task scan ever reads the log as a task. the
 *        comment dao appends to it, and the task dao removes it with its task
 */
export const getOsFileopsCommentLogPath = (input: {
  radioDir: string;
  exid: string;
}): string =>
  path.join(
    input.radioDir,
    `task.${asOsFileopsPathSegment({ value: input.exid, of: 'exid' })}.comments.jsonl`,
  );
