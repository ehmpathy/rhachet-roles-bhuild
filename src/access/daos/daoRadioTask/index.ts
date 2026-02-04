import type { RadioChannel } from '../../../domain.objects/RadioChannel';
import {
  type ContextGithubAuth,
  type ContextGitRepo,
  isContextGithubAuth,
} from '../../../domain.objects/RadioContext';
import { daoRadioTaskViaGhIssues } from './daoRadioTaskViaGhIssues';
import { daoRadioTaskViaOsFileops } from './daoRadioTaskViaOsFileops';

export {
  daoRadioTaskViaGhIssues,
  daoRadioTaskViaOsFileops,
  isContextGithubAuth,
};
export type { ContextGithubAuth, ContextGitRepo };

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
