import { execFileSync } from 'child_process';

/**
 * .what = the root dir of the git tree that holds `process.cwd()`, or null when none does
 * .why = a verb keys its state to the tree it runs in. the git call runs at the process's own cwd,
 *        never one a caller names (rule.forbid.cwd-override)
 */
export const getOneGitTreeDirOfCwd = (): string | null => {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
      .toString('utf8')
      .trim();
  } catch (error) {
    // only a git that ran and exited nonzero means "not a tree"; a spawn fault is rethrown
    if (!isExitedNonzero({ error })) throw error;
    return null;
  }
};

/**
 * .what = did a child process run and exit with a numeric status
 */
const isExitedNonzero = (input: { error: unknown }): boolean =>
  typeof input.error === 'object' &&
  input.error !== null &&
  'status' in input.error &&
  typeof input.error.status === 'number';
