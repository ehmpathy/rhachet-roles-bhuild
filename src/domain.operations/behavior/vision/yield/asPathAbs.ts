import { isAbsolute, join } from 'path';

/**
 * .what = a path placed against cwd: an absolute path as is, a relative one under cwd; each
 *         normalized, so `a/../b` reads where it truly lands
 * .why  = the depth lane places `--vision` against cwd at two steps (realpath, containment);
 *         one transformer keeps the two placements identical
 */
export const asPathAbs = (input: { path: string; cwd: string }): string =>
  isAbsolute(input.path) ? join(input.path) : join(input.cwd, input.path);
