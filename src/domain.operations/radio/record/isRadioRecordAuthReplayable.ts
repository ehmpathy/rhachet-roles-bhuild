import { asGithubAuthMode } from '@src/domain.operations/radio/auth/asGithubAuthMode';

/**
 * .what = does an env var name read as a token var
 * .why = a stored env() auth may only point at a var meant to hold a github token
 */
const isRadioEnvVarTokenNamed = (input: { name: string }): boolean =>
  /^[A-Za-z_][A-Za-z0-9_]*$/.test(input.name) &&
  input.name.toUpperCase().split('_').includes('TOKEN');

/**
 * .what = may an auth read back from a record file be replayed by a drain
 * .why = a record file is tracked; it can arrive by a merge, from another clone. an auth
 *        that runs a shell command (`as-robot:shx(...)`), or one whose keyrack owner is
 *        spliced into a shell line, would then run that clone's text on this machine
 *
 * .note = only an auth typed in this process may run a shell (a live push, or `drain --auth`);
 *         a stored one may name a mode, never a command. an unknown mode passes here, since
 *         the auth derive already refuses it with its own fix
 *
 * .note = a stored `env(VAR)` sends that var's value to github as the token, so a planted
 *         `env(AWS_SECRET_ACCESS_KEY)` would leak a secret; a stored one must name a token var,
 *         one whose name holds a `TOKEN` segment (GH_TOKEN, GITHUB_TOKEN, *_TOKEN, *_TOKEN_*)
 */
export const isRadioRecordAuthReplayable = (input: {
  auth: string | null;
}): boolean => {
  if (input.auth === null) return true;
  const mode = asGithubAuthMode({ auth: input.auth });
  if (mode.kind === 'shx') return false;
  if (mode.kind === 'via-keyrack')
    return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(mode.owner);
  if (mode.kind === 'env')
    return isRadioEnvVarTokenNamed({ name: mode.envVar });
  return true;
};
