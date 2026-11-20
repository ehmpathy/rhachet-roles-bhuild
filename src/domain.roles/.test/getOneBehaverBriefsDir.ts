import { ROLE_BEHAVER } from '../behaver/getBehaverRole';

/**
 * .what = the one briefs dir the behaver role declares
 * .why  = a test outside the roles context that reads a behaver brief reads it from the role's
 *         own declaration, never a hand-built path into its layout; one boundary, owned here
 */
export const getOneBehaverBriefsDir = (): string => {
  const dirs = ROLE_BEHAVER.briefs.dirs;
  const dir = Array.isArray(dirs) ? dirs[0] : dirs;
  if (!dir) throw new Error('the behaver role declares no briefs dir');
  return dir.uri;
};
