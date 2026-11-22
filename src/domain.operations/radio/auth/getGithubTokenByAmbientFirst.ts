import { ConstraintError } from 'helpful-errors';
import type { keyrack } from 'rhachet/keyrack';

import type { EhmpathSpot } from './EhmpathSpot';
import { genAuthFromKeyrack } from './genAuthFromKeyrack';
import { getAmbientReadOrNone } from './getAmbientReadOrNone';
import { getEhmpathAuthMissMessage } from './getEhmpathAuthMissMessage';
import { getEhmpathTokenFromKeyrack } from './getEhmpathTokenFromKeyrack';
import { isAmbientReadAllowed } from './isAmbientReadAllowed';
import { isEhmpathEmail } from './isEhmpathEmail';

/**
 * .what = the github auth a radio send uses when no --auth is given: the box's own identity first
 * .why = on an ehmpath box the robot's gh login is right there, so it sends with no question; on
 *        a human's box the send is the human's own, as-human; neither box has to name a value
 *
 * .note = by the ambient git email:
 *   - an ehmpath email → its gh login (the robot), else keyrack, else a miss that names both
 *   - any other email  → as-human, the gh login of the human at the box
 *   - no email at all  → the keyrack robot token, the default before ambient-first (F17)
 *
 * .note = a test env with no stub gh declared never reads ambient; it takes the keyrack path, so
 *         no test reaches a real gh login and the extant keyrack-default tests hold (F17)
 *
 * .returns ehmpathSpot = the spot that paid when the send is the ehmpath robot from ambient or its
 *          keyrack fallback; null for as-human and the plain keyrack default, whose output reads
 *          as before
 */
export const getGithubTokenByAmbientFirst = async (
  input: Record<string, never>,
  context: {
    env: NodeJS.ProcessEnv;
    shx: (command: string) => Promise<{ stdout: string; stderr: string }>;
    keyrackGet?: typeof keyrack.get;
  },
): Promise<
  | { token: string; role: 'as-robot'; ehmpathSpot: EhmpathSpot | null }
  | { token: null; role: 'as-human'; ehmpathSpot: null }
> => {
  // a test env with no stub never reads ambient; and a box with no email declares no identity
  const email = isAmbientReadAllowed({ env: context.env })
    ? await getAmbientReadOrNone({ command: 'git config user.email' }, context)
    : null;
  if (!email) return getGithubTokenFromKeyrackDefault({}, context);

  // a human's box sends as the human at it
  if (!isEhmpathEmail({ email }))
    return { token: null, role: 'as-human', ehmpathSpot: null };

  // an ehmpath box sends with its own gh login, unasked
  const tokenAmbient = await getAmbientReadOrNone(
    { command: 'gh auth token' },
    context,
  );
  if (tokenAmbient)
    return { token: tokenAmbient, role: 'as-robot', ehmpathSpot: 'ambient' };

  // an ehmpath box with no gh login falls to the keyrack robot token
  const keyrackFound = await getEhmpathTokenFromKeyrack({}, context);
  if ('token' in keyrackFound)
    return {
      token: keyrackFound.token,
      role: 'as-robot',
      ehmpathSpot: 'keyrack',
    };

  // neither spot paid; name each one checked
  throw new ConstraintError(
    getEhmpathAuthMissMessage({
      auth: null,
      misses: [
        {
          row: 'ambient: ehmpath email, but gh holds no login',
          fix: 'log gh in as the ehmpath account: gh auth login',
          cause: null,
        },
        keyrackFound.miss,
      ],
    }),
    { auth: null },
  );
};

/**
 * .what = the keyrack robot token at the extant default coordinate
 * .why = a box that declares no identity, and every test env with no stub gh, keeps the send it
 *        had before ambient-first, byte for byte (its slug still reads the cwd repo's org)
 */
const getGithubTokenFromKeyrackDefault = async (
  input: Record<string, never>,
  context: {
    shx: (command: string) => Promise<{ stdout: string; stderr: string }>;
    keyrackGet?: typeof keyrack.get;
  },
): Promise<{ token: string; role: 'as-robot'; ehmpathSpot: null }> => {
  const { token } = await genAuthFromKeyrack(
    {
      owner: 'ehmpath',
      env: 'prep',
      key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
      org: null,
    },
    { shx: context.shx, keyrackGet: context.keyrackGet },
  );
  return { token, role: 'as-robot', ehmpathSpot: null };
};
