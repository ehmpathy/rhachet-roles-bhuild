import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

import { flattenBranchName } from './flattenBranchName';

/**
 * .what = find which behavior (if any) a branch is bound to
 * .why  = both hooks and skills need to discover binds
 */
export const getBoundBehaviorByBranch = (input: {
  branchName?: string;
  cwd?: string;
}): { behaviorDir: string | null; binds: string[] } => {
  const cwd = input.cwd ?? process.cwd();

  // get the current branch name if not provided
  const branchName =
    input.branchName ??
    execSync('git rev-parse --abbrev-ref HEAD', {
      cwd,
      encoding: 'utf-8',
    }).trim();

  // flatten the branch name for filesystem lookup
  const flatBranch = flattenBranchName({ branchName });
  const flagFileName = `${flatBranch}.flag`;

  // search for .behavior/*/.bind/${flagFileName}
  const behaviorRoot = join(cwd, '.behavior');
  if (!existsSync(behaviorRoot)) return { behaviorDir: null, binds: [] };

  // find all behavior directories
  const behaviorDirs = readdirSync(behaviorRoot, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  // check each behavior for a bind flag
  const binds: string[] = [];
  for (const behaviorDirName of behaviorDirs) {
    const bindDir = join(behaviorRoot, behaviorDirName, '.bind');
    const flagPath = join(bindDir, flagFileName);
    if (existsSync(flagPath)) {
      binds.push(join(behaviorRoot, behaviorDirName));
    }
  }

  // return based on how many binds found
  if (binds.length === 0) return { behaviorDir: null, binds: [] };

  // single bind found
  const bindFound = binds[0];
  if (binds.length === 1 && bindFound) return { behaviorDir: bindFound, binds };

  // multiple binds found - return null for behaviorDir, let caller decide
  return { behaviorDir: null, binds };
};
