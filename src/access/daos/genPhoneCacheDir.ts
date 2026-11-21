import { promises as fs } from 'fs';
import { join } from 'path';

import { getOnePhoneCacheDir } from './getOnePhoneCacheDir';

/**
 * .what = findserts the cache root with a self-ignore, so no mailbox file can be staged
 * .why = a tree whose `.agent/.cache/` is not already ignored would otherwise show every text
 *        in its diff
 */
export const genPhoneCacheDir = async (input: {
  treeDir: string;
}): Promise<string> => {
  const dir = getOnePhoneCacheDir(input);
  await fs.mkdir(dir, { recursive: true });
  await fs
    .writeFile(join(dir, '.gitignore'), '*\n', { flag: 'wx' })
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'EEXIST') return;
      throw error;
    });
  return dir;
};
