import { existsSync, rmSync } from 'fs';
import { basename, join } from 'path';

import { flattenBranchName } from './flattenBranchName';
import { getBoundBehaviorByBranch } from './getBoundBehaviorByBranch';

/**
 * .what = unbind a branch from its behavior
 *
 * .why  = removes the bind flag file that associates a branch with a behavior
 *
 * @returns success status and message
 */
export const delBranchBehaviorBound = (input: {
  branchName: string;
}): { success: boolean; message: string; wasUnbound?: boolean } => {
  const flatBranch = flattenBranchName({ branchName: input.branchName });

  // check if bound
  const bound = getBoundBehaviorByBranch({ branchName: input.branchName });

  if (!bound.behaviorDir) {
    return {
      success: true,
      message: 'no bind found',
      wasUnbound: true,
    };
  }

  // remove the bind flag
  const flagPath = join(bound.behaviorDir, '.bind', `${flatBranch}.flag`);
  if (existsSync(flagPath)) {
    rmSync(flagPath);
  }

  return {
    success: true,
    message: `unbound branch '${input.branchName}' from: ${basename(bound.behaviorDir)}`,
  };
};
