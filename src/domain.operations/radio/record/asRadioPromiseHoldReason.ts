import type { RadioRepoVisibility } from '@src/domain.objects/RadioRepoVisibility';

import type { RadioPromiseHoldReason } from '../promise/RadioPromiseHoldReason';
import { isRadioUpstreamReasonCuredByAuth } from './isRadioUpstreamReasonCuredByAuth';

/**
 * .what = the reason the promise gate holds an owed record on, from its repo's visibility
 * .why = only a repo read as private or internal may take unvouched text; a public repo, or one
 *        whose visibility could not be read, holds the record (a failed read cannot tell
 *        private from absent, so it fails closed)
 *
 * .note = causeCode is the upstream reason of a failed read (null: none); a cause another
 *         auth may cure marks the hold so its fix leads with `--auth as-human`
 */
export const asRadioPromiseHoldReason = (input: {
  visibility: RadioRepoVisibility;
  causeCode: string | null;
}): RadioPromiseHoldReason | null => {
  if (input.visibility === 'private' || input.visibility === 'internal')
    return null;
  if (input.visibility === 'public') return 'public-repo:unpromised';
  if (isRadioUpstreamReasonCuredByAuth({ reason: input.causeCode }))
    return 'public-repo:unreadable-auth';
  return 'public-repo:unreadable';
};
