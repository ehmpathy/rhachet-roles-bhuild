import type { ContextGithubAuth } from '../../../domain.objects/RadioContext';
import type { RadioRepoVisibility } from '../../../domain.objects/RadioRepoVisibility';
import type { RadioTaskRepo } from '../../../domain.objects/RadioTaskRepo';
import { asGhRepoVisibilityFromJson } from './asGhRepoVisibilityFromJson';
import { getOneGhCallTimeout } from './getOneGhCallTimeout';
import { runGhCommand } from './runGhCommand';

/**
 * .what = the visibility of one github repo, read via `gh repo view <owner/name> --json visibility`
 * .why = a task text sent to a public repo cannot be taken back, so the promise gate must know
 *        whether the target is public before the first request that carries text
 *
 * .note = the repo is always named: with no argument, gh reads the repo of the cwd instead
 * .note = an answer gh gave that is not an exact enum reads unreadable, with its cause; a gh
 *         call that fails throws, as every gh call here does, so the caller sorts a fault
 *         (a wall, a refusal, an absent repo) from a defect with the same allowlist the
 *         request uses
 * .note = the call runs under the record's own auth, bound by the send's limit when a drain set one
 */
export const getOneGhRepoVisibility = async (
  input: { repo: RadioTaskRepo },
  context: ContextGithubAuth,
): Promise<
  | { visibility: Exclude<RadioRepoVisibility, 'unreadable'> }
  | { visibility: 'unreadable'; cause: string }
> => {
  const stdout = await runGhCommand(
    {
      args: [
        'repo',
        'view',
        `${input.repo.owner}/${input.repo.name}`,
        '--json',
        'visibility',
      ],
      timeout: getOneGhCallTimeout({ limit: context.github.send ?? null }),
    },
    context,
  );
  return asGhRepoVisibilityFromJson({ stdout });
};
