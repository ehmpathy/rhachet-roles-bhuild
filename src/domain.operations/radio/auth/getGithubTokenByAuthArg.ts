import { BadRequestError } from 'helpful-errors';

import { getAuthFromKeyrack } from './getAuthFromKeyrack';

/**
 * .what = get github token from auth argument
 * .why = centralizes auth derivation logic for gh.issues channel
 *
 * .note
 *   - defaults to via-keyrack(ehmpath) when --auth not specified
 *   - the shx(...) pattern enables token retrieval from adhoc remote sources,
 *     such as 1password, vault, aws secrets manager, or any cli tool that
 *     outputs a token
 *
 * .returns
 *   - { token: string; role: 'as-robot' } when token is available
 *   - { token: null; role: 'as-human' } when as-human (use gh cli auto login)
 *
 * .throws
 *   - BadRequestError when as-robot:env(VAR) but VAR not set
 *   - BadRequestError when as-robot:shx(...) command fails or has no output
 *   - BadRequestError when as-robot:via-keyrack(owner) fails
 *   - BadRequestError when as-human in test environment (tests must use explicit tokens)
 */
export const getGithubTokenByAuthArg = async (
  input: { auth: string | undefined },
  context: {
    env: NodeJS.ProcessEnv;
    shx: (command: string) => Promise<{ stdout: string; stderr: string }>;
  },
): Promise<
  { token: string; role: 'as-robot' } | { token: null; role: 'as-human' }
> => {
  // default to via-keyrack(ehmpath) if no --auth specified
  const auth = input.auth ?? 'as-robot:via-keyrack(ehmpath)';
  // check for as-robot:via-keyrack(owner) pattern (token from keyrack)
  const keyrackMatch = auth.match(/^as-robot:via-keyrack\((.+)\)$/);
  if (keyrackMatch) {
    const owner = keyrackMatch[1]!;
    const { token } = await getAuthFromKeyrack({
      owner,
      env: 'prep',
      key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
    });
    return { token, role: 'as-robot' };
  }

  // check for as-robot:shx(...) pattern (token from shell command)
  const shxMatch = auth.match(/^as-robot:shx\((.+)\)$/);
  if (shxMatch) {
    const shellCommand = shxMatch[1]!;
    const result = await context.shx(shellCommand);
    const tokenValue = result.stdout.trim();
    if (!tokenValue) {
      throw new BadRequestError(
        `--auth as-robot:shx(...) command produced no output. stderr: ${result.stderr}`,
      );
    }
    return { token: tokenValue, role: 'as-robot' };
  }

  // check for as-robot:env(...) pattern (explicit token from env var)
  const envMatch = auth?.match(/^as-robot:env\((.+)\)$/);
  if (envMatch) {
    const envVarName = envMatch[1]!;
    const tokenValue = context.env[envVarName];
    if (!tokenValue) {
      throw new BadRequestError(
        `--auth as-robot:env(${envVarName}) specified but ${envVarName} is not set`,
      );
    }
    return { token: tokenValue, role: 'as-robot' };
  }

  // check for as-human (explicit gh cli intent, takes precedence over GITHUB_TOKEN)
  if (auth === 'as-human') {
    // failfast in test env — tests must use explicit tokens, not gh cli auto login
    const isTestEnv =
      context.env.NODE_ENV === 'test' ||
      context.env.JEST_WORKER_ID !== undefined;
    if (isTestEnv) {
      throw new BadRequestError(
        '--auth as-human is forbidden in test environment. use --auth as-robot:env(TOKEN_VAR) or --auth as-robot:shx(command) instead.',
      );
    }
    return { token: null, role: 'as-human' };
  }

  // unrecognized auth mode
  throw new BadRequestError(
    [
      `unrecognized --auth mode: ${auth}`,
      '',
      'supported modes:',
      '├─ as-robot:via-keyrack(owner)  (default: ehmpath)',
      '│     use token from keyrack',
      '├─ as-robot:shx(command)',
      '│     execute shell command to retrieve token',
      '├─ as-robot:env(VAR)',
      '│     use token from environment variable',
      '└─ as-human',
      '      use gh cli logged-in session (interactive)',
    ].join('\n'),
  );
};
