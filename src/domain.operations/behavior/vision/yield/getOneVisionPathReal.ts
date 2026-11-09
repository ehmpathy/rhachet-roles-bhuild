import { realpathSync } from 'fs';
import { basename, dirname, join } from 'path';

import { asErrorWithCode } from './asErrorWithCode';
import { asPathAbs } from './asPathAbs';
import { asRefusalOfReadCode } from './asRefusalOfReadCode';

/**
 * .what = the realpath of a path; where it does not exist, the realpath of its nearest extant
 *         ancestor, with the rest appended as given
 * .why  = an absent yield must still reach the read, which names it absent with its fix — and it
 *         must place against cwd by the same real root that cwd resolves to
 */
const getOnePathReal = (input: { path: string }): string => {
  try {
    return realpathSync(input.path);
  } catch (error) {
    // allowlist: a path the caller can fix walks up — the codes the read refuses, from the one
    // table, so the read that follows names it by the same errno, with its fix. all else is
    // rethrown as is
    const { code } = asErrorWithCode({ error });
    if (!asRefusalOfReadCode({ code, pathRel: input.path })) throw error;

    // the filesystem root always exists, so the walk ends
    const parent = dirname(input.path);
    if (parent === input.path) return input.path;
    return join(getOnePathReal({ path: parent }), basename(input.path));
  }
};

/**
 * .what = the `--vision` path and cwd, each through its symlinks to the file it names
 * .why  = containment is a fact of the filesystem, not of the string: a yield reached through a
 *         symlinked worktree sits inside the repo, and must place inside
 */
export const getOneVisionPathReal = (input: {
  vision: string;
  cwd: string;
}): { vision: string; cwd: string } => {
  return {
    vision: getOnePathReal({
      path: asPathAbs({ path: input.vision, cwd: input.cwd }),
    }),
    cwd: getOnePathReal({ path: input.cwd }),
  };
};
