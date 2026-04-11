import { MalfunctionError } from 'helpful-errors';
import { keyrack } from 'rhachet/keyrack';

/**
 * .what = get github token from keyrack
 * .why = centralizes keyrack-based auth for radio skills
 *
 * .throws
 *   - MalfunctionError when keyrack returns status !== 'granted' (absent, locked, or blocked)
 */
export const getAuthFromKeyrack = async (input: {
  owner: string;
  env: string;
  key: string;
}): Promise<{ token: string }> => {
  const { attempt, emit } = await keyrack.get({
    for: { key: input.key },
    env: input.env,
    owner: input.owner,
  });

  // fail fast if not granted — forward keyrack output for visibility
  if (attempt.status !== 'granted') {
    throw new MalfunctionError(`keyrack:\n${emit.stdout}`, {
      status: attempt.status,
      owner: input.owner,
      env: input.env,
      key: input.key,
    });
  }

  return { token: attempt.grant.key.secret };
};
