import { BadRequestError } from 'helpful-errors';

import {
  daoRadioTaskCommentViaGhIssues,
  daoRadioTaskCommentViaOsFileops,
} from '../../../../access/daos/daoRadioTask';
import { RadioChannel } from '../../../../domain.objects/RadioChannel';
import {
  type ContextDispatchRadio,
  isContextGithubAuth,
} from '../../../../domain.objects/RadioContext';
import type { RadioTaskRepo } from '../../../../domain.objects/RadioTaskRepo';
import { assure } from '../../../../infra/types/assure';

/**
 * .what = post one comment on an extant thread, once; or keep the one already there
 * .why = a comment amends a task without a rewrite of its body or title, which a robot often
 *        may not do (#394); the exact body on the thread already counts as sent (F3)
 *
 * .note = an absent thread throws a BadRequestError: upstream will never take this comment, so
 *         the drain closes the record as refused (isRadioReplayRefusal). a fault that another
 *         try may cure (a repo the auth cannot see, a timeout) bubbles as is, and holds it
 */
export const setRadioTaskComment = async <TChannel extends RadioChannel>(
  input: {
    via: TChannel;
    repo: RadioTaskRepo;
    exid: string;
    body: string;
  },
  context: ContextDispatchRadio<TChannel>,
): Promise<{ url: string | null; outcome: 'posted' | 'kept' }> => {
  // find or post via the channel's comment dao
  const result =
    input.via === RadioChannel.GH_ISSUES
      ? await daoRadioTaskCommentViaGhIssues.set.findsert(
          { repo: input.repo, exid: input.exid, body: input.body },
          assure(isContextGithubAuth, context),
        )
      : await daoRadioTaskCommentViaOsFileops.set.findsert({
          repo: input.repo,
          exid: input.exid,
          body: input.body,
        });

  // an absent thread is a refusal: no retry will make it exist
  // .note = the fix rides in the message, since a refusal shows only its headline
  if (!result)
    throw new BadRequestError(
      `#${input.exid} not found in ${input.repo.owner}/${input.repo.name}; check --exid and --into, then comment again`,
      { exid: input.exid, via: input.via },
    );
  return result;
};
