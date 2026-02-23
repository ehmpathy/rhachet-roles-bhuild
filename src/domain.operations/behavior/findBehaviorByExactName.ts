import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * .what = find extant behavior directory by exact name suffix
 *
 * .why  = enables reusing extant behaviors when re-running init.behavior
 *         with the same name but potentially different date
 *
 * @returns behavior directory path if found, null if not found
 */
export const findBehaviorByExactName = (
  input: {
    name: string;
    targetDir: string;
  },
  context: { cwd: string },
): string | null => {
  // construct path to .behavior root
  const behaviorRoot = join(context.cwd, input.targetDir, '.behavior');

  // if .behavior doesn't exist yet, no match possible
  if (!existsSync(behaviorRoot)) {
    return null;
  }

  // find behavior directories matching pattern v*_*_*.${name}
  const allBehaviors = readdirSync(behaviorRoot, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  // match exact name suffix after date prefix (v2025_01_01.name-here)
  const pattern = new RegExp(
    `^v\\d{4}_\\d{2}_\\d{2}\\.${escapeRegex(input.name)}$`,
  );
  const matches = allBehaviors.filter((dir) => pattern.test(dir));

  // no match found
  if (matches.length === 0) {
    return null;
  }

  // return first match (could sort by date if multiple, but shouldn't happen)
  return join(input.targetDir, '.behavior', matches[0]!);
};

/**
 * .what = escape special regex characters in a string
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
