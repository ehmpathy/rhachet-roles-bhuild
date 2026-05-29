import type { RadioChannel } from './RadioChannel';
import type { RadioTaskRepo } from './RadioTaskRepo';

/**
 * .what = context shape for github auth
 * .why = explicit auth: either token string or as-human mode (gh cli session)
 *
 * .critical = never use default env unless role='as-human'
 */
export type ContextGithubAuth = {
  github: {
    auth:
      | { token: string; role: 'as-robot' }
      | { token: null; role: 'as-human' };
  };
};

/**
 * .what = context shape for git repo
 * .why = explicit repo target for radio operations
 */
export type ContextGitRepo = {
  git: {
    repo: RadioTaskRepo;
  };
};

/**
 * .what = type guard to check if context has github auth
 * .why = enables type-safe narrow via assure() without 'as' casts
 */
export const isContextGithubAuth = (
  context: ContextGitRepo | (ContextGithubAuth & ContextGitRepo),
): context is ContextGithubAuth & ContextGitRepo => {
  return 'github' in context && context.github?.auth !== undefined;
};

/**
 * .what = generic context type that requires auth based on channel
 * .why = enables type-safe context requirements per channel
 *
 * .critical = GH_ISSUES requires ContextGithubAuth; OS_FILEOPS only needs ContextGitRepo
 */
export type ContextDispatchRadio<TChannel extends RadioChannel> =
  TChannel extends RadioChannel.GH_ISSUES
    ? ContextGithubAuth & ContextGitRepo
    : ContextGitRepo;
