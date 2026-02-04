import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * .what = get current git/gh user
 * .why = record who pushed/claimed task
 */
export const getCurrentActor = async (): Promise<string> => {
  try {
    // try gh cli first (gets github username)
    const { stdout } = await execAsync('gh api user -q .login');
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
