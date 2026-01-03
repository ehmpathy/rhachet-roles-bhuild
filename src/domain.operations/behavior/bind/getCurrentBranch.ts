import { execSync } from 'child_process';

/**
 * .what = get the current git branch name
 *
 * .why  = needed for bind operations to determine which branch to bind
 */
export const getCurrentBranch = (): string => {
  return execSync('git rev-parse --abbrev-ref HEAD', {
    encoding: 'utf-8',
  }).trim();
};
