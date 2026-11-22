import { ConstraintError } from 'helpful-errors';
import type { keyrack } from 'rhachet/keyrack';

import { asEhmpathKeyrackMiss } from './asEhmpathKeyrackMiss';
import { genAuthFromKeyrack } from './genAuthFromKeyrack';

/**
 * .what = the one keyrack coordinate the ehmpath robot token lives at
 * .why = as-ehmpath-via-keyrack must read the same key as as-robot:via-keyrack(ehmpath)
 *
 * .note = the org is pinned, so the slug never depends on the cwd repo: a repo with no
 *         keyrack.yml, or one whose keyrack.yml names another org, still reads the
 *         ehmpathy robot token, and keyrack misses honestly rather than throw
 */
const KEYRACK_EHMPATH = {
  owner: 'ehmpath',
  env: 'prep',
  key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
  org: 'ehmpathy',
} as const;

/**
 * .what = the ehmpath robot token from keyrack, or what keyrack held and its fix
 * .why = as-ehmpath checks keyrack first and must name its status on a miss, so a keyrack
 *        refusal is an answer here, not a throw
 *
 * .note = only a keyrack ConstraintError (a non-granted status) becomes a miss; any other
 *         throw is a fault, and it rethrows
 *
 * .note = when the auto-unlock command itself failed (rhx not on PATH, an unfilled
 *         credential), its raw cause rides along as `cause`, so the miss keeps what the
 *         extant keyrack nudge keeps in its metadata
 */
export const getEhmpathTokenFromKeyrack = async (
  input: Record<string, never>,
  context: {
    shx: (command: string) => Promise<{ stdout: string; stderr: string }>;
    keyrackGet?: typeof keyrack.get;
  },
): Promise<
  | { token: string }
  | { miss: { row: string; fix: string | null; cause: string | null } }
> => {
  try {
    return await genAuthFromKeyrack(KEYRACK_EHMPATH, context);
  } catch (error) {
    if (!(error instanceof ConstraintError)) throw error;
    return {
      miss: asEhmpathKeyrackMiss({ error, coordinate: KEYRACK_EHMPATH }),
    };
  }
};
