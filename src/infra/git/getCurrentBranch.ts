import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * .what = get current git branch name
 * .why = record branch when task is claimed
 */
export const getCurrentBranch = async (): Promise<string> => {
  const { stdout } = await execAsync('git branch --show-current');
  return stdout.trim();
};
