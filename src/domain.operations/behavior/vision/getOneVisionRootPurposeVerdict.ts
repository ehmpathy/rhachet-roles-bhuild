import { ConstraintError } from 'helpful-errors';

import { asVisionRootPurposeReport } from './rootPurpose/asVisionRootPurposeReport';
import { getOneVisionRootPurpose } from './rootPurpose/getOneVisionRootPurpose';
import { asVisionPath } from './yield/asVisionPath';
import { getOneVisionFile } from './yield/getOneVisionFile';
import { getOneVisionPathReal } from './yield/getOneVisionPathReal';

/**
 * .what = the depth lane's verdict on one vision yield, read from disk
 * .why  = the lane reads the file the guard names; a path outside cwd or an absent yield is
 *         the caller's to fix, so each fails loud (exit 2 via the cli) and never reads as clean
 */
export const getOneVisionRootPurposeVerdict = (
  input: { vision: string },
  context: { cwd: string },
): ReturnType<typeof asVisionRootPurposeReport> => {
  // follow each path through its symlinks, so containment is judged on the real filesystem
  const pathReal = getOneVisionPathReal({
    vision: input.vision,
    cwd: context.cwd,
  });

  // place the path; refuse one outside cwd (rule.forbid.cwd-override). a ConstraintError is a
  // BadRequestError, so it meets that rule and rule.require.failloud both, as its peers do
  const path = asVisionPath(pathReal);
  if (!path.isInside)
    throw new ConstraintError('--vision must be inside cwd', {
      vision: input.vision,
      cwd: context.cwd,
      hint: "pass the yield's path from cwd: --vision '$route/1.vision.yield.md'",
    });

  // read the yield, judge its root purpose, render the verdict
  const { markdown } = getOneVisionFile({
    pathAbs: path.pathAbs,
    pathRel: path.pathRel,
  });
  const purpose = getOneVisionRootPurpose({ markdown });
  return asVisionRootPurposeReport({ vision: path.pathRel, purpose });
};
