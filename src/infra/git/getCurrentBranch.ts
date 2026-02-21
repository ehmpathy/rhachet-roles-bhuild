import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * .what = get current git branch or tag name
 * .why = record branch/tag when task is claimed
 */
export const getCurrentBranch = async (): Promise<string> => {
  // try branch first
  const { stdout: branch } = await execAsync('git branch --show-current');
  if (branch.trim()) return branch.trim();

  // fallback to tag if in detached HEAD state
  try {
    const { stdout: tag } = await execAsync(
      'git describe --tags --exact-match',
    );
    return tag.trim();
  } catch {
    // not on a tag either - return empty string
    return '';
  }
};
