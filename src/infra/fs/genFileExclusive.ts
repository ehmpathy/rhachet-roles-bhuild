import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';

import { asErrorCode } from '@src/infra/errors/asErrorCode';

/**
 * .what = writes a file only if none is there; false when one already is
 * .why = the bytes land in a temp file first, then a hard link names them at the path in one
 *        atomic step. a reader never sees the path empty or half written, which a direct create
 *        with flag `wx` would expose between its open and its write
 */
export const genFileExclusive = async (input: {
  path: string;
  bytes: string;
}): Promise<boolean> => {
  const temp = `${input.path}.tmp.${process.pid}.${randomUUID()}`;
  await fs.writeFile(temp, input.bytes);
  const isLinked = await fs.link(temp, input.path).then(
    () => true,
    (error: unknown) => {
      if (asErrorCode({ error }) === 'EEXIST') return false;
      throw error;
    },
  );
  await fs.rm(temp, { force: true });
  return isLinked;
};
