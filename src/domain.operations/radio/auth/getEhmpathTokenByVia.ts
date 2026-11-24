import { ConstraintError } from 'helpful-errors';
import type { keyrack } from 'rhachet/keyrack';

import type { AmbientIdentity } from './AmbientIdentity';
import { asEhmpathAuthMisses } from './asEhmpathAuthMisses';
import { asEhmpathAuthMissMetadata } from './asEhmpathAuthMissMetadata';
import type { EhmpathSpot } from './EhmpathSpot';
import type { EhmpathSpotFound } from './EhmpathSpotFound';
import { getEhmpathAuthMissMessage } from './getEhmpathAuthMissMessage';
import { getEhmpathTokenFromAmbient } from './getEhmpathTokenFromAmbient';
import { getEhmpathTokenFromKeyrack } from './getEhmpathTokenFromKeyrack';

/**
 * .what = the ehmpath robot token from the first of its spots that holds one, in the order given
 * .why = every path that sends as the ehmpath robot reads its spots through this one walk, so
 *        the order alone differs and a miss reads the same on each path:
 *          - as-ehmpath              keyrack, then ambient
 *          - as-ehmpath-via-keyrack  keyrack only, so a keyrack fault is never masked
 *          - as-ehmpath-via-ambient  ambient only
 *          - the default, on an ehmpath email  ambient, then keyrack (seed S1)
 *
 * .note = each call names its keyrack org (pinned, or null for the cwd repo's), so one call
 *         reads one slug; and the identity it already read, if any, so the email is read once
 *
 * .note = a spot that faults (an ambient read that exits with a fault) is that spot's miss, so
 *         the walk goes on to the next spot; a walk with no spot left names each one checked
 *
 * .name = `get<Noun>`, not `getOne<Noun>`, to match its caller `getGithubTokenByAuthArg` and
 *         its two leaves `getEhmpathTokenFrom{Keyrack,Ambient}`: a token is singular by nature,
 *         and the auth folder names every token read this one way
 *
 * .throws ConstraintError that names each spot checked, what each held, and the fix
 */
export const getEhmpathTokenByVia = async (
  input: {
    auth: string | null;
    spots: EhmpathSpot[];
    keyrackOrg: string | null;
    identity: AmbientIdentity | null;
  },
  context: {
    env: NodeJS.ProcessEnv;
    shx: (command: string) => Promise<{ stdout: string; stderr: string }>;
    keyrackGet?: typeof keyrack.get;
  },
): Promise<{ token: string; spot: EhmpathSpot }> => {
  // read each spot in order; the first that holds a token pays
  const founds: { spot: EhmpathSpot; found: EhmpathSpotFound }[] = [];
  for (const spot of input.spots) {
    const found =
      spot === 'keyrack'
        ? await getEhmpathTokenFromKeyrack({ org: input.keyrackOrg }, context)
        : await getEhmpathTokenFromAmbient(
            { identity: input.identity },
            context,
          );
    if ('token' in found) return { token: found.token, spot };
    founds.push({ spot, found });
  }

  // no spot paid; name each one checked
  const keyrackFound =
    founds.find((entry) => entry.spot === 'keyrack')?.found ?? null;
  throw new ConstraintError(
    getEhmpathAuthMissMessage({
      auth: input.auth,
      misses: asEhmpathAuthMisses({
        founds: founds.map((entry) => entry.found),
      }),
    }),
    asEhmpathAuthMissMetadata({ auth: input.auth, keyrackFound }),
  );
};
