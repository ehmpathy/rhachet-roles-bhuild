import { ConstraintError } from 'helpful-errors';

import type { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { getRepoFromGitContext } from '@src/infra/git/getRepoFromGitContext';

import { asRadioTaskRepoFromArg } from './asRadioTaskRepoFromArg';

/**
 * .what = derive radio task repo from explicit arg or git context fallback
 * .why  = provides clear narrative for repo derivation in CLI orchestrators
 */
export const getOneRadioTaskRepoFromCliArg = async (input: {
  arg: string | null;
  argName: string;
  errorContext: {
    notFoundMessage: string;
    hint: string;
  };
}): Promise<RadioTaskRepo> => {
  // derive from explicit arg if provided
  if (input.arg !== null)
    return asRadioTaskRepoFromArg({ arg: input.arg, argName: input.argName });

  // fallback to git context
  const repoFromGit = await getRepoFromGitContext();
  if (repoFromGit) return repoFromGit;

  // no repo found
  throw new ConstraintError(input.errorContext.notFoundMessage, {
    hint: input.errorContext.hint,
  });
};
