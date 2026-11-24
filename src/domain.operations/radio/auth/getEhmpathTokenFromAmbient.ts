import { AMBIENT_READ_GH_LOGIN } from './AMBIENT_READ_GH_LOGIN';
import type { AmbientIdentity } from './AmbientIdentity';
import { AmbientReadFaultError } from './AmbientReadFaultError';
import { getAmbientIdentity } from './getAmbientIdentity';
import { getAmbientReadOrNone } from './getAmbientReadOrNone';

/**
 * .what = the ehmpath token from the box's own gh login, or what the box held and its fix
 * .why = as-ehmpath falls back to the ambient login, but only on a box that declares itself
 *        ehmpath via its git config user.email; a human's box must never pay as the robot
 *
 * .note = "ambient" is the effective git config of the repo the skill runs in (repo-local over
 *         global), plus the host's gh login (AMBIENT_READ_GH_LOGIN: the stored login, never an
 *         env token). the email bar reads first, so a human's box never reaches the gh read
 *
 * .note = identity null means this spot reads it; the default passes the identity it already
 *         read, so the email is read once per send
 *
 * .note = a read that faults is this spot's miss, named with its exit and fix, so a walk goes
 *         on to its next spot; the test guard's refusal is no fault, and it rethrows
 */
export const getEhmpathTokenFromAmbient = async (
  input: { identity: AmbientIdentity | null },
  context: {
    env: NodeJS.ProcessEnv;
    shx: (command: string) => Promise<{ stdout: string; stderr: string }>;
  },
): Promise<
  { token: string } | { miss: { row: string; fix: string | null; cause: null } }
> => {
  try {
    return await getEhmpathTokenFromAmbientReads(input, context);
  } catch (error) {
    if (!(error instanceof AmbientReadFaultError)) throw error;
    return {
      miss: {
        row: `ambient: the ambient read \`${error.command}\` failed (exit ${error.exitCode ?? 'none, cut off'}) — ${error.execError}`,
        fix: `check that \`${error.command}\` runs on this box, or skip the ambient spot: --auth as-ehmpath-via-keyrack`,
        cause: null,
      },
    };
  }
};

/**
 * .what = the two ambient reads, in order: the identity, then the gh login
 */
const getEhmpathTokenFromAmbientReads = async (
  input: { identity: AmbientIdentity | null },
  context: {
    env: NodeJS.ProcessEnv;
    shx: (command: string) => Promise<{ stdout: string; stderr: string }>;
  },
): Promise<
  { token: string } | { miss: { row: string; fix: string | null; cause: null } }
> => {
  // read the identity the box declares, unless the caller already did
  const identity = input.identity ?? (await getAmbientIdentity({}, context));
  if (identity.kind === 'none')
    return {
      miss: {
        row: 'ambient: git config user.email unset',
        fix: null,
        cause: null,
      },
    };
  if (identity.kind === 'human')
    return {
      miss: {
        row: `ambient: git config user.email = ${identity.email}, not an ehmpath email`,
        fix: null,
        cause: null,
      },
    };

  // read the token of the box's stored gh login
  const token = await getAmbientReadOrNone(
    { command: AMBIENT_READ_GH_LOGIN },
    context,
  );
  if (!token)
    return {
      miss: {
        row: 'ambient: ehmpath email, but gh holds no login',
        fix: 'log gh in as the ehmpath account: gh auth login',
        cause: null,
      },
    };
  return { token };
};
