import { exec } from 'child_process';
import { promisify } from 'util';

import type { ContextGithubAuth } from '../../domain.objects/RadioContext';

const execAsync = promisify(exec);

/**
 * .what = get current git/gh user
 * .why = record who pushed/claimed task
 */
export const getCurrentActor = async (
  input: {},
  context: ContextGithubAuth,
): Promise<string> => {
  // build env with explicit token if provided
  const env = (() => {
    if (!context.github.auth.token) return undefined;
    const {
      GH_TOKEN: _removed,
      GITHUB_TOKEN: _removed2,
      ...envWithoutToken
    } = process.env;
    return { ...envWithoutToken, GH_TOKEN: context.github.auth.token };
  })();

  try {
    // try gh cli first (gets github username)
    const { stdout } = await execAsync('gh api user -q .login', {
      env,
      timeout: 5000,
    });
    const login = stdout.trim();
    if (login) return login;
  } catch {
    // fallback to git config
  }

  try {
    // fallback: git config user name
    const { stdout } = await execAsync('git config user.name');
    const name = stdout.trim();
    if (name) return name;
  } catch {
    // no git config
  }

  return 'unknown';
};
