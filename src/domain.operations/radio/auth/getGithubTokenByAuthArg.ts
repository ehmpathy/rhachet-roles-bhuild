import { BadRequestError } from 'helpful-errors';

/**
 * .what = resolve github token from auth argument
 * .why = centralizes auth resolution logic for gh.issues channel
 *
 * .note
 *   the shx(...) pattern enables token retrieval from adhoc remote sources,
 *   such as 1password, vault, aws secrets manager, or any cli tool that
 *   outputs a token. this allows flexible auth without env var setup.
 *
 * .returns
 *   - { token: string } when token is available (as-robot or GITHUB_TOKEN)
 *   - { token: null } when as-human (use gh cli auto login)
 *
 * .throws
 *   - BadRequestError when as-robot:env(VAR) but VAR not set
 *   - BadRequestError when as-robot:shx(...) command fails or has no output
 *   - BadRequestError when as-human in test environment (tests must use explicit tokens)
 *   - BadRequestError when no auth method detected
 */
export const getGithubTokenByAuthArg = async (
  input: { auth: string | undefined },
  context: {
    env: NodeJS.ProcessEnv;
    shx: (command: string) => Promise<{ stdout: string; stderr: string }>;
  },
): Promise<{
  token: string | null;
  method: 'as-robot' | 'as-human' | 'env';
}> => {
  // check for as-robot:shx(...) pattern (token from shell command)
  const shxMatch = input.auth?.match(/^as-robot:shx\((.+)\)$/);
  if (shxMatch) {
    const shellCommand = shxMatch[1]!;
    const result = await context.shx(shellCommand);
    const tokenValue = result.stdout.trim();
    if (!tokenValue) {
      throw new BadRequestError(
        `--auth as-robot:shx(...) command produced no output. stderr: ${result.stderr}`,
      );
    }
    return { token: tokenValue, method: 'as-robot' };
  }

  // check for as-robot:env(...) pattern (explicit token from env var)
  const envMatch = input.auth?.match(/^as-robot:env\((.+)\)$/);
  if (envMatch) {
    const envVarName = envMatch[1]!;
    const tokenValue = context.env[envVarName];
    if (!tokenValue) {
      throw new BadRequestError(
        `--auth as-robot:env(${envVarName}) specified but ${envVarName} is not set`,
      );
    }
    return { token: tokenValue, method: 'as-robot' };
  }

  // check for as-human (explicit gh cli intent, takes precedence over GITHUB_TOKEN)
  if (input.auth === 'as-human') {
    // failfast in test env — tests must use explicit tokens, not gh cli auto login
    const isTestEnv =
      context.env.NODE_ENV === 'test' ||
      context.env.JEST_WORKER_ID !== undefined;
    if (isTestEnv) {
      throw new BadRequestError(
        '--auth as-human is forbidden in test environment. use --auth as-robot:env(TOKEN_VAR) or --auth as-robot:shx(command) instead.',
      );
    }
    return { token: null, method: 'as-human' };
  }

  // check for GITHUB_TOKEN in env (implicit fallback)
  if (context.env.GITHUB_TOKEN) {
    return { token: context.env.GITHUB_TOKEN, method: 'env' };
  }

  // no auth detected
  throw new BadRequestError(
    [
      'no auth detected for gh.issues channel',
      '',
      'tips:',
      '├─ --auth as-human',
      '│     use gh cli logged-in session (interactive)',
      '├─ --auth as-robot:env(VAR)',
      '│     use token from environment variable',
      '└─ --auth as-robot:shx(command)',
      '      execute shell command to retrieve token',
    ].join('\n'),
  );
};
