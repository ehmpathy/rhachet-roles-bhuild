import { mkdirSync, writeFileSync } from 'fs';
import { basename, join } from 'path';

import { flattenBranchName } from './flattenBranchName';
import { getBranchBehaviorBind } from './getBranchBehaviorBind';

/**
 * .what = bind a branch to a behavior
 *
 * .why  = creates the bind flag file that associates a branch with a behavior
 *
 * @returns success status and message
 */
export const setBranchBehaviorBind = (
  input: {
    branchName: string;
    behaviorDir: string;
    boundBy?: string;
  },
  context?: { cwd?: string },
): { success: boolean; message: string; alreadyBound?: boolean } => {
  const flatBranch = flattenBranchName({ branchName: input.branchName });

  // check if already bound
  const bound = getBranchBehaviorBind(
    { branchName: input.branchName },
    context,
  );

  if (bound.behaviorDir) {
    if (bound.behaviorDir === input.behaviorDir) {
      return {
        success: true,
        message: `already bound to: ${basename(input.behaviorDir)}`,
        alreadyBound: true,
      };
    } else {
      return {
        success: false,
        message: `branch already bound to different behavior: ${basename(bound.behaviorDir)}`,
      };
    }
  }

  // create bind directory if needed
  const bindDir = join(input.behaviorDir, '.bind');
  mkdirSync(bindDir, { recursive: true });

  // create bind flag with metadata
  const flagPath = join(bindDir, `${flatBranch}.flag`);
  const boundAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  writeFileSync(
    flagPath,
    `branch: ${input.branchName}
bound_at: ${boundAt}
bound_by: ${input.boundBy ?? 'bind.behavior skill'}
`,
  );

  return {
    success: true,
    message: `bound branch '${input.branchName}' to: ${basename(input.behaviorDir)}`,
  };
};
