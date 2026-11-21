import {
  type ContextDispatchRadio,
  type ContextGithubAuth,
  type ContextGitRepo,
  isContextGithubAuth,
} from '../../../domain.objects/RadioContext';
import { asGhIssueNumber } from './asGhIssueNumber';
import { asOsFileopsPathSegment } from './asOsFileopsPathSegment';
import { daoRadioTaskCommentViaGhIssues } from './daoRadioTaskCommentViaGhIssues';
import { daoRadioTaskCommentViaOsFileops } from './daoRadioTaskCommentViaOsFileops';
import { daoRadioTaskViaGhIssues } from './daoRadioTaskViaGhIssues';
import { daoRadioTaskViaOsFileops } from './daoRadioTaskViaOsFileops';

export {
  asGhIssueNumber,
  asOsFileopsPathSegment,
  daoRadioTaskCommentViaGhIssues,
  daoRadioTaskCommentViaOsFileops,
  daoRadioTaskViaGhIssues,
  daoRadioTaskViaOsFileops,
  isContextGithubAuth,
};
export type { ContextDispatchRadio, ContextGithubAuth, ContextGitRepo };
