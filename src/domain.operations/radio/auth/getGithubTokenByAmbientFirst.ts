import type { keyrack } from 'rhachet/keyrack';

import { AMBIENT_READ_GH_LOGIN } from './AMBIENT_READ_GH_LOGIN';
import type { AmbientIdentity } from './AmbientIdentity';
import type { AuthSource } from './AuthSource';
import { asAmbientHumanNoLoginError } from './asAmbientHumanNoLoginError';
import { asGhEnvTokenName } from './asGhEnvTokenName';
import { genAuthFromKeyrack } from './genAuthFromKeyrack';
import { getAmbientIdentity } from './getAmbientIdentity';
import { getAmbientReadOrNone } from './getAmbientReadOrNone';
import { getEhmpathTokenByVia } from './getEhmpathTokenByVia';
import { isAmbientReadAllowed } from './isAmbientReadAllowed';
import { KEYRACK_EHMPATH_COORDINATE } from './KEYRACK_EHMPATH_COORDINATE';

/**
 * .what = the default keyrack org: null, so the slug follows the cwd repo's keyrack.yml
 * .why = the default reads one slug on every branch, as it read before ambient-first (F17)
 */
const KEYRACK_ORG_DEFAULT = null;

/**
 * .what = the github auth a radio send uses when no --auth is given: the box's own identity first
 * .why = on an ehmpath box the robot's gh login is right there, so it sends with no question; on
 *        a human's box the send is the human's own, as-human; neither box has to name a value
 *
 * .note = by the ambient identity (one read of the git email):
 *   - an ehmpath email → its gh login (the robot), else keyrack, else a miss that names both; a
 *     gh read that faults is the ambient spot's miss, so keyrack still pays
 *   - any other email  → as-human, the stored gh login of the human at the box, else a miss with
 *     the fix
 *   - no email at all  → the keyrack robot token, the default before ambient-first (F17)
 *
 * .note = the fault rule, once: a read that picks the identity (the email; the human's gh login,
 *         which is the as-human send itself) holds loud when it faults, since no identity is left
 *         to send as; a read inside a spot walk (the ehmpath gh login) is that spot's miss (F24)
 *
 * .note = a test env with no stub gh declared never reads ambient; it takes the keyrack path, so
 *         no test reaches a real gh login and the extant keyrack-default tests hold (F17)
 *
 * .returns authSource = where the identity came from: the spot that paid for the ehmpath robot,
 *          or the ambient email for as-human; null for the plain keyrack default (F17)
 */
export const getGithubTokenByAmbientFirst = async (
  input: Record<string, never>,
  context: {
    env: NodeJS.ProcessEnv;
    shx: (command: string) => Promise<{ stdout: string; stderr: string }>;
    keyrackGet?: typeof keyrack.get;
  },
): Promise<
  | { token: string; role: 'as-robot'; authSource: AuthSource | null }
  | { token: null; role: 'as-human'; authSource: AuthSource }
> => {
  // a test env with no stub never reads ambient; and a box with no email declares no identity
  const identity: AmbientIdentity = isAmbientReadAllowed({ env: context.env })
    ? await getAmbientIdentity({}, context)
    : { kind: 'none' };
  if (identity.kind === 'none')
    return getGithubTokenFromKeyrackDefault({}, context);

  // a human's box sends as the human at it, under the stored gh login the send itself uses
  if (identity.kind === 'human') {
    const loginHuman = await getAmbientReadOrNone(
      { command: AMBIENT_READ_GH_LOGIN },
      context,
    );
    if (!loginHuman)
      throw asAmbientHumanNoLoginError({
        email: identity.email,
        envTokenName: asGhEnvTokenName({ env: context.env }),
      });
    return {
      token: null,
      role: 'as-human',
      authSource: { auth: 'as-human', spot: 'ambient', email: identity.email },
    };
  }

  // an ehmpath box sends with its own gh login, unasked; else its keyrack robot token (S1)
  const { token, spot } = await getEhmpathTokenByVia(
    {
      auth: null,
      spots: ['ambient', 'keyrack'],
      keyrackOrg: KEYRACK_ORG_DEFAULT,
      identity,
    },
    context,
  );
  return { token, role: 'as-robot', authSource: { auth: 'as-ehmpath', spot } };
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
): Promise<{ token: string; role: 'as-robot'; authSource: null }> => {
  const { token } = await genAuthFromKeyrack(
    { ...KEYRACK_EHMPATH_COORDINATE, org: KEYRACK_ORG_DEFAULT },
    { shx: context.shx, keyrackGet: context.keyrackGet },
  );
  return { token, role: 'as-robot', authSource: null };
};
