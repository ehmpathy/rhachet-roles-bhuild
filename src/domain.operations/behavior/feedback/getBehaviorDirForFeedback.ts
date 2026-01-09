import { BadRequestError } from 'helpful-errors';

import { getBranchBehaviorBind } from '../bind/getBranchBehaviorBind';
import { getBehaviorDir } from '../getBehaviorDir';

/**
 * .what = resolve the behavior directory for feedback operations
 * .why = supports both bound behavior discovery and explicit --behavior flag
 *
 * .note = priority:
 *         - if branch is bound and no flag → use bind
 *         - if branch is bound and flag matches → use bind
 *         - if branch is bound and flag differs → error (unless --force)
 *         - if branch not bound and flag → use flag
 *         - if branch not bound and no flag → error
 */
export const getBehaviorDirForFeedback = (
  input: { behavior?: string; force?: boolean },
  context?: { cwd?: string },
): string => {
  const cwd = context?.cwd ?? process.cwd();

  // check for branch bind
  const { behaviorDir: boundDir } = getBranchBehaviorBind({}, { cwd });

  // branch is bound
  if (boundDir) {
    // no explicit flag → use bind
    if (!input.behavior) return boundDir;

    // resolve the flag to a directory
    const flagDir = getBehaviorDir({ name: input.behavior, targetDir: cwd });

    // flag matches bind → use bind
    if (flagDir === boundDir) return boundDir;

    // flag differs from bind → error unless force
    if (!input.force) {
      throw new BadRequestError(
        `branch is bound to ${boundDir} but --behavior flag specifies ${flagDir}. use --force to override.`,
      );
    }

    // force override → use flag
    return flagDir;
  }

  // branch not bound, flag provided → use flag
  if (input.behavior) {
    return getBehaviorDir({ name: input.behavior, targetDir: cwd });
  }

  // branch not bound, no flag → error
  throw new BadRequestError(
    'no behavior bound to current branch. use --behavior to specify one.',
  );
};
