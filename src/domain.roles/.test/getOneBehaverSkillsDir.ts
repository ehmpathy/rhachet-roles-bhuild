import { ROLE_BEHAVER } from '../behaver/getBehaverRole';

/**
 * .what = the one skills dir the behaver role declares
 * .why  = a test outside the roles context that reads a behaver skill reads it from the role's
 *         own declaration, never a hand-built path into its layout; one boundary, owned here
 */
export const getOneBehaverSkillsDir = (): string => {
  const dirs = ROLE_BEHAVER.skills.dirs;
  const dir = Array.isArray(dirs) ? dirs[0] : dirs;
  if (!dir) throw new Error('the behaver role declares no skills dir');
  return dir.uri;
};
