import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';

import { asErrorCode } from '@src/infra/errors/asErrorCode';

/**
 * .what = removes a file only if it still holds the bytes the caller read; true when this caller
 *         removed them
 * .why = a stale lock or claim is reclaimed by two steps: remove the stale file, then create a
 *        fresh one. two reclaimers that read the same stale file may interleave so that the slower
 *        one's remove lands on the faster one's FRESH file; a blind remove would then let both
 *        believe they hold the slot. so the file is first renamed to a name only this caller knows
 *        (one atomic step, which only one caller can win), then its bytes are compared:
 *        - the stale bytes        → removed; this caller may now create
 *        - other bytes (a fresh holder's) → linked back to the path, and this caller loses
 *        - already gone (ENOENT)  → another reclaimer moved it first; this caller loses
 *
 * .note = the put-back is a link, so it never clobbers a file a third caller created in the gap.
 *         in that three-way case the fresh holder whose file was moved loses its slot to the third;
 *         a holder that must be sure re-reads its own file before it acts
 */
export const delFileIfUnchanged = async (input: {
  path: string;
  bytesExpected: string;
}): Promise<boolean> => {
  // move the file to a name only this caller knows; a lost race finds it gone
  const aside = `${input.path}.aside.${process.pid}.${randomUUID()}`;
  const isMoved = await fs.rename(input.path, aside).then(
    () => true,
    (error: unknown) => {
      if (asErrorCode({ error }) === 'ENOENT') return false;
      throw error;
    },
  );
  if (!isMoved) return false;

  // the stale bytes are ours to remove
  const bytesMoved = await fs.readFile(aside, 'utf8');
  if (bytesMoved === input.bytesExpected) {
    await fs.rm(aside, { force: true });
    return true;
  }

  // a fresh holder's file was moved: put it back, unless a third caller already took the path
  await fs.link(aside, input.path).catch((error: unknown) => {
    if (asErrorCode({ error }) === 'EEXIST') return;
    throw error;
  });
  await fs.rm(aside, { force: true });
  return false;
};
