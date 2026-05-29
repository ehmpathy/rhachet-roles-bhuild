import {
  type ContextDispatchRadio,
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
export type { ContextDispatchRadio, ContextGithubAuth, ContextGitRepo };
