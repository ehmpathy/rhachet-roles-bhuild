import type { AmbientIdentity } from './AmbientIdentity';
import { getAmbientReadOrNone } from './getAmbientReadOrNone';
import { isEhmpathEmail } from './isEhmpathEmail';

/**
 * .what = the identity this box declares: none, an ehmpath email, or a human's email
 * .why = one read of `git config user.email`, classified once, for every path that branches on it
 *
 * .throws AmbientReadFaultError when the read faults (never read as "none"); the guard's
 *         ConstraintError in a test env with no stub gh
 */
export const getAmbientIdentity = async (
  input: Record<string, never>,
  context: {
    env: NodeJS.ProcessEnv;
    shx: (command: string) => Promise<{ stdout: string; stderr: string }>;
  },
): Promise<AmbientIdentity> => {
  const email = await getAmbientReadOrNone(
    { command: 'git config user.email' },
    context,
  );
  if (!email) return { kind: 'none' };
  if (isEhmpathEmail({ email })) return { kind: 'ehmpath', email };
  return { kind: 'human', email };
};
