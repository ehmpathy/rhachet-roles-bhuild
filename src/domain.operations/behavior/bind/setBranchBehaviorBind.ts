import { mkdirSync, writeFileSync } from 'fs';
import { BadRequestError } from 'helpful-errors';
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
    targetDir?: string;
  },
  context: { cwd: string },
): { success: boolean; message: string; alreadyBound?: boolean } => {
  // reject bind to main or master branch
  const branchesProtected = ['main', 'master'];
  if (branchesProtected.includes(input.branchName))
    throw new BadRequestError(
      `can not bind '${input.branchName}' branch to a behavior. please switch to a scoped branch first, then run bind again`,
      { branchName: input.branchName, branchesProtected },
    );

  const branchFlat = flattenBranchName({ branchName: input.branchName });

  // check if already bound
  const bound = getBranchBehaviorBind(
    {
      branchName: input.branchName,
      targetDir: input.targetDir,
    },
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
  const flagPath = join(bindDir, `${branchFlat}.flag`);
  writeFileSync(
    flagPath,
    `branch: ${input.branchName}
bound_by: ${input.boundBy ?? 'bind.behavior skill'}
`,
  );

  return {
    success: true,
    message: `bound branch '${input.branchName}' to: ${basename(input.behaviorDir)}`,
  };
};
