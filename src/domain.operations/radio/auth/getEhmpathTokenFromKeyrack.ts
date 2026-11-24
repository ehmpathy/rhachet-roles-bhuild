import { ConstraintError } from 'helpful-errors';
import type { keyrack } from 'rhachet/keyrack';

import { asEhmpathKeyrackMiss } from './asEhmpathKeyrackMiss';
import { genAuthFromKeyrack } from './genAuthFromKeyrack';
import { KEYRACK_EHMPATH_COORDINATE } from './KEYRACK_EHMPATH_COORDINATE';

/**
 * .what = the ehmpath robot token from keyrack, or what keyrack held and its fix
 * .why = as-ehmpath checks keyrack first and must name its status on a miss, so a keyrack
 *        refusal is an answer here, not a throw
 *
 * .note = the org is the caller's choice, explicit per call (see KEYRACK_EHMPATH_COORDINATE):
 *         the as-ehmpath values pin it; the default reads the cwd repo's org, on every branch
 *
 * .note = only a keyrack ConstraintError (a non-granted status) becomes a miss; any other
 *         throw is a fault, and it rethrows
 *
 * .note = when the auto-unlock command itself failed (rhx not on PATH, an unfilled
 *         credential), its raw cause rides along as `cause`, so the miss keeps what the
 *         extant keyrack nudge keeps in its metadata
 */
export const getEhmpathTokenFromKeyrack = async (
  input: { org: string | null },
  context: {
    shx: (command: string) => Promise<{ stdout: string; stderr: string }>;
    keyrackGet?: typeof keyrack.get;
  },
): Promise<
  | { token: string }
  | { miss: { row: string; fix: string | null; cause: string | null } }
> => {
  const coordinate = { ...KEYRACK_EHMPATH_COORDINATE, org: input.org };
  try {
    return await genAuthFromKeyrack(coordinate, {
      shx: context.shx,
      keyrackGet: context.keyrackGet,
    });
  } catch (error) {
    if (!(error instanceof ConstraintError)) throw error;
    return { miss: asEhmpathKeyrackMiss({ error, coordinate }) };
  }
};
