import { BadRequestError } from 'helpful-errors';

/**
 * .what = extract org from owner/repo format
 * .why = radio permission checks need org name to lookup org-level permissions
 */
export const extractOrgFromRepo = (input: { repo: string }): string => {
  // validate not empty
  if (!input.repo || input.repo.trim() === '') {
    throw new BadRequestError('repo cannot be empty', {
      repo: input.repo,
      hint: 'expected format: owner/repo',
    });
  }

  // split on slash
  const parts = input.repo.split('/');

  // validate format
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new BadRequestError('invalid repo format', {
      repo: input.repo,
      hint: 'expected format: owner/repo',
    });
  }

  return parts[0];
};
