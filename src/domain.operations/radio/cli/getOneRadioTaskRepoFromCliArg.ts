import { BadRequestError } from 'helpful-errors';

import type { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { getRepoFromGitContext } from '@src/infra/git/getRepoFromGitContext';

import { asRadioTaskRepoFromArg } from './asRadioTaskRepoFromArg';

/**
 * .what = derive radio task repo from explicit arg (required)
 * .why  = pit of success: explicit is better than implicit, require users to
 *         specify target repo via @this (current git repo) or owner/name
 */
export const getOneRadioTaskRepoFromCliArg = async (input: {
  arg: string | null;
  argName: string;
  errorContext: {
    notFoundMessage: string;
    hint: string;
  };
}): Promise<RadioTaskRepo> => {
  // require explicit arg (no silent fallback)
  if (input.arg === null)
    throw new BadRequestError(input.errorContext.notFoundMessage, {
      hint: input.errorContext.hint,
    });

  // handle @this sentinel: derive from current git repo
  if (input.arg === '@this') {
    const repoFromGit = await getRepoFromGitContext();
    if (!repoFromGit)
      throw new BadRequestError(
        `${input.argName}=@this requires a git repository`,
        {
          hint: 'run from within a git repository, or specify owner/name explicitly',
        },
      );
    return repoFromGit;
  }

  // handle owner/name format
  return asRadioTaskRepoFromArg({ arg: input.arg, argName: input.argName });
};
