import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

import { flattenBranchName } from './flattenBranchName';

/**
 * .what = find which behavior (if any) a branch is bound to
 * .why  = both hooks and skills need to discover bindings
 */
export const getBoundBehaviorByBranch = (input: {
  branchName?: string;
  cwd?: string;
}): { behaviorDir: string | null; bindings: string[] } => {
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
  if (!existsSync(behaviorRoot)) return { behaviorDir: null, bindings: [] };

  // find all behavior directories
  const behaviorDirs = readdirSync(behaviorRoot, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  // check each behavior for a bind flag
  const bindings: string[] = [];
  for (const behaviorDirName of behaviorDirs) {
    const bindDir = join(behaviorRoot, behaviorDirName, '.bind');
    const flagPath = join(bindDir, flagFileName);
    if (existsSync(flagPath)) {
      bindings.push(join(behaviorRoot, behaviorDirName));
    }
  }

  // return based on how many bindings found
  if (bindings.length === 0) return { behaviorDir: null, bindings: [] };

  // single binding found
  const singleBinding = bindings[0];
  if (bindings.length === 1 && singleBinding)
    return { behaviorDir: singleBinding, bindings };

  // multiple bindings found - return null for behaviorDir, let caller decide
  return { behaviorDir: null, bindings };
};
