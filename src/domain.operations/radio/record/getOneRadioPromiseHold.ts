import type {
  ContextGithubAuth,
  ContextGitRepo,
} from '@src/domain.objects/RadioContext';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { isRadioPromiseOwedByRecord } from '../promise/isRadioPromiseOwedByRecord';
import type { RadioPromiseHoldReason } from '../promise/RadioPromiseHoldReason';
import { asRadioPromiseHoldReason } from './asRadioPromiseHoldReason';
import { getOneRadioRepoVisibilityRead } from './getOneRadioRepoVisibilityRead';
import { isRadioUpstreamReasonHalt } from './isRadioUpstreamReasonHalt';

/**
 * .what = should the promise gate hold this record, and on what
 * .why = a record that carries text and no promise may go out only to a repo read as private
 *        or internal; this reads the repo's visibility, under the record's own auth, and says
 *        whether the record is held for its promise, halted at a wall, or free to send
 *
 * .note = three answers, each declared:
 *         - promise: the repo reads public, or could not be read; the record awaits a vouch
 *         - wall:    the read met a rate limit or an outage; the drain halts, as at a request wall
 *         - null:    no promise owed (no read made), or the repo reads private / internal
 */
export const getOneRadioPromiseHold = async (
  input: { record: RadioTaskRecord; promiseOverride: string | null },
  context: { radioContext: ContextGithubAuth & ContextGitRepo },
): Promise<
  | { kind: 'promise'; reason: RadioPromiseHoldReason; cause: string | null }
  | { kind: 'wall'; reason: string; cause: string }
  | null
> => {
  // no text to leak, or a vouch on hand: no read
  if (!isRadioPromiseOwedByRecord(input)) return null;

  // read the visibility, a gh fault settled into a cause and a code
  const read = await getOneRadioRepoVisibilityRead(
    { record: input.record },
    context.radioContext,
  );

  // a wall binds every send: halt, as a request wall does
  if (read.causeCode && isRadioUpstreamReasonHalt({ reason: read.causeCode }))
    return {
      kind: 'wall',
      reason: read.causeCode,
      cause: read.cause ?? read.causeCode,
    };

  // public or unreadable: held for its promise; private or internal: free to send
  const reason = asRadioPromiseHoldReason({
    visibility: read.visibility,
    causeCode: read.causeCode,
  });
  if (!reason) return null;
  return { kind: 'promise', reason, cause: read.cause };
};
