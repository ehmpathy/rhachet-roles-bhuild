import { getAmbientReadOrNone } from './getAmbientReadOrNone';
import { isEhmpathEmail } from './isEhmpathEmail';

/**
 * .what = the ehmpath token from the box's own gh login, or what the box held and its fix
 * .why = as-ehmpath falls back to the ambient login, but only on a box that declares itself
 *        ehmpath via its git config user.email; a human's box must never pay as the robot
 *
 * .note = "ambient" is the effective git config of the repo the skill runs in (repo-local over
 *         global), plus the host's gh login. the email bar reads first, so a human's box never
 *         reaches `gh auth token` under this mode
 *
 * .note = each read goes through getAmbientReadOrNone, which holds the test guard and the
 *         exit rule, so a test that forgot its stub gh fails loud before any shell runs
 */
export const getEhmpathTokenFromAmbient = async (
  input: Record<string, never>,
  context: {
    env: NodeJS.ProcessEnv;
    shx: (command: string) => Promise<{ stdout: string; stderr: string }>;
  },
): Promise<
  { token: string } | { miss: { row: string; fix: string | null; cause: null } }
> => {
  // read the identity the box declares
  const email = await getAmbientReadOrNone(
    { command: 'git config user.email' },
    context,
  );
  if (!email)
    return {
      miss: {
        row: 'ambient: git config user.email unset',
        fix: null,
        cause: null,
      },
    };
  if (!isEhmpathEmail({ email }))
    return {
      miss: {
        row: `ambient: git config user.email = ${email}, not an ehmpath email`,
        fix: null,
        cause: null,
      },
    };

  // read the token of the box's gh login
  const token = await getAmbientReadOrNone(
    { command: 'gh auth token' },
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
