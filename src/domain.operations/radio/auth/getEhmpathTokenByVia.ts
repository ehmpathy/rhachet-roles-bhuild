import { ConstraintError } from 'helpful-errors';
import type { keyrack } from 'rhachet/keyrack';

import { asEhmpathAuthMisses } from './asEhmpathAuthMisses';
import { asEhmpathAuthMissMetadata } from './asEhmpathAuthMissMetadata';
import type { EhmpathSpot } from './EhmpathSpot';
import { getEhmpathAuthMissMessage } from './getEhmpathAuthMissMessage';
import { getEhmpathTokenFromAmbient } from './getEhmpathTokenFromAmbient';
import { getEhmpathTokenFromKeyrack } from './getEhmpathTokenFromKeyrack';
import { isEhmpathSpotAllowed } from './isEhmpathSpotAllowed';

/**
 * .what = the ehmpath robot token, from keyrack, the ambient login, or keyrack then ambient
 * .why = one value, as-ehmpath, sends as the robot wherever the robot's token lives, and
 *        never as a human; the two explicit values pin it to one spot
 *
 * .note = keyrack is read first, so on a box with both, keyrack pays. via-keyrack never
 *         reads ambient, so a keyrack fault is never masked
 *
 * .note = returns the spot that paid; the caller decides whether to show it
 *
 * .name = `get<Noun>`, not `getOne<Noun>`, to match its caller `getGithubTokenByAuthArg` and
 *         its two leaves `getEhmpathTokenFrom{Keyrack,Ambient}`: a token is singular by nature,
 *         and the auth folder names every token read this one way
 *
 * .throws ConstraintError that names each spot checked, what each held, and the fix
 */
export const getEhmpathTokenByVia = async (
  input: { auth: string; via: EhmpathSpot | 'either' },
  context: {
    env: NodeJS.ProcessEnv;
    shx: (command: string) => Promise<{ stdout: string; stderr: string }>;
    keyrackGet?: typeof keyrack.get;
  },
): Promise<{ token: string; spot: EhmpathSpot }> => {
  // keyrack first, unless the caller pinned ambient
  const keyrackFound = isEhmpathSpotAllowed({ via: input.via, spot: 'keyrack' })
    ? await getEhmpathTokenFromKeyrack({}, context)
    : null;
  if (keyrackFound && 'token' in keyrackFound)
    return { token: keyrackFound.token, spot: 'keyrack' };

  // then ambient, unless the caller pinned keyrack
  const ambientFound = isEhmpathSpotAllowed({ via: input.via, spot: 'ambient' })
    ? await getEhmpathTokenFromAmbient({}, context)
    : null;
  if (ambientFound && 'token' in ambientFound)
    return { token: ambientFound.token, spot: 'ambient' };

  // no spot paid; name each one checked
  throw new ConstraintError(
    getEhmpathAuthMissMessage({
      auth: input.auth,
      misses: asEhmpathAuthMisses({ founds: [keyrackFound, ambientFound] }),
    }),
    asEhmpathAuthMissMetadata({ auth: input.auth, keyrackFound }),
  );
};
