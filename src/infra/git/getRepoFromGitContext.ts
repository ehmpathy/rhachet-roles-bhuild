import { exec } from 'child_process';
import { promisify } from 'util';

import { RadioTaskRepo } from '../../domain.objects/RadioTaskRepo';

const execAsync = promisify(exec);

/**
 * .what = resolve RadioTaskRepo from current git directory
 * .why = default --repo to current git context
 */
export const getRepoFromGitContext =
  async (): Promise<RadioTaskRepo | null> => {
    try {
      // try gh cli first (most reliable)
      const { stdout } = await execAsync(
        'gh repo view --json nameWithOwner -q .nameWithOwner',
      );
      const nameWithOwner = stdout.trim();
      if (nameWithOwner) {
        const [owner, name] = nameWithOwner.split('/');
        if (owner && name) {
          return new RadioTaskRepo({ owner, name });
        }
      }
    } catch {
      // fallback to git remote parse
    }

    try {
      // fallback: parse git remote origin
      const { stdout } = await execAsync('git remote get-url origin');
      const url = stdout.trim();

      // parse ssh format: git@github.com:owner/repo.git
      const sshMatch = url.match(/git@github\.com:([^/]+)\/([^.]+)(?:\.git)?$/);
      if (sshMatch) {
        const [, owner, name] = sshMatch;
        if (owner && name) {
          return new RadioTaskRepo({ owner, name });
        }
      }

      // parse https format: https://github.com/owner/repo.git
      const httpsMatch = url.match(
        /https:\/\/github\.com\/([^/]+)\/([^.]+)(?:\.git)?$/,
      );
      if (httpsMatch) {
        const [, owner, name] = httpsMatch;
        if (owner && name) {
          return new RadioTaskRepo({ owner, name });
        }
      }
    } catch {
      // not in a git repo or no remote
    }

    return null;
  };
