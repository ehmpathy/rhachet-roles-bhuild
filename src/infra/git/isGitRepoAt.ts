import { existsSync } from 'fs';
import { join } from 'path';

/**
 * .what = whether this dir is the root of a git repo (it holds a `.git`)
 * .why = outside a git repo no branch exists, so no branch can bind a route
 */
export const isGitRepoAt = (input: { dir: string }): boolean =>
  existsSync(join(input.dir, '.git'));
