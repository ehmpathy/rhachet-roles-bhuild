import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * .what = whether a grove is in this grove's registry, `<forestDir>/groves/<grove>.json`
 * .why = the registry is the supervisor's (`rhx git.grove.list` reads it); the phone asks only
 *        whether a grove is known, through this one read, and never parses its file
 */
export const isGitGroveKnown = async (input: {
  forestDir: string;
  grove: string;
}): Promise<boolean> =>
  fs.stat(join(input.forestDir, 'groves', `${input.grove}.json`)).then(
    () => true,
    (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    },
  );
