import * as path from 'path';

import { asOsFileopsPathSegment } from './asOsFileopsPathSegment';

/**
 * .what = the os.fileops task file path for an exid
 * .why = the task dao writes it, and the comment dao checks it exists before it appends
 */
export const getOsFileopsTaskFilePath = (input: {
  radioDir: string;
  exid: string;
}): string =>
  path.join(
    input.radioDir,
    `task.${asOsFileopsPathSegment({ value: input.exid, of: 'exid' })}._.md`,
  );
