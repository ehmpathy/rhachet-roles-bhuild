import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * .what = finds all behavior directories (.behavior/{name}/) in a repository
 * .why = enables gathering all behaviors from a local repository
 */
export const enumBehaviorDirs = async (input: {
  repoDir: string;
}): Promise<string[]> => {
  // check for .behavior directory
  const behaviorRoot = path.join(input.repoDir, '.behavior');
  const behaviorDirExists = await fs
    .stat(behaviorRoot)
    .then((s) => s.isDirectory())
    .catch(() => false);

  if (!behaviorDirExists) return [];

  // enumerate subdirectories under .behavior/
  const entries = await fs.readdir(behaviorRoot, { withFileTypes: true });
  const behaviorDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(behaviorRoot, entry.name));

  return behaviorDirs;
};
