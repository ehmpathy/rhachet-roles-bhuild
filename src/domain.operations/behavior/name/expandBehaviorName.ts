import { BadRequestError } from 'helpful-errors';

/**
 * .what = expand @branch token to behavior name from current branch
 * .why  = enables zero-friction behavior name from branch context
 */
export const expandBehaviorName = (input: {
  name: string;
  branch: string;
}): string => {
  // passthrough for explicit names
  if (input.name !== '@branch') return input.name;

  // reject detached HEAD
  if (input.branch === 'HEAD')
    throw new BadRequestError('cannot expand @branch in detached HEAD state');

  // reject protected branches
  const protectedBranches = ['main', 'master'];
  if (protectedBranches.includes(input.branch))
    throw new BadRequestError(
      `cannot init behavior on protected branch: ${input.branch}`,
    );

  // extract last segment (strip all prefixes)
  const segments = input.branch.split('/');
  return segments[segments.length - 1]!;
};
