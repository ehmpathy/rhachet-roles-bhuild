import { getOneGhRepoVisibility } from '@src/access/daos/daoRadioTask/getOneGhRepoVisibility';
import type { ContextGithubAuth } from '@src/domain.objects/RadioContext';
import type { RadioRepoVisibility } from '@src/domain.objects/RadioRepoVisibility';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioFaultCauseLine } from './asRadioFaultCauseLine';
import { asRadioUpstreamFault } from './asRadioUpstreamFault';
import { asRadioUpstreamFaultText } from './asRadioUpstreamFaultText';
import { asRadioUpstreamReason } from './asRadioUpstreamReason';

/**
 * .what = the visibility of a record's repo, as one settled read: the answer, its cause when
 *         it could not be read, and the fault code when a gh call failed
 * .why = the promise gate decides on one shape. a gh fault is sorted by the allowlist the
 *        request uses (asRadioUpstreamFault): a fault becomes a cause and a code, which the gate
 *        reads as a hold or a wall; a defect rethrows and fails loud
 *
 * .note = causeCode is null unless a gh call failed: an off-shape answer is unreadable with a
 *         cause, yet no fault, so it never reads as a wall
 */
export const getOneRadioRepoVisibilityRead = async (
  input: { record: RadioTaskRecord },
  context: ContextGithubAuth,
): Promise<{
  visibility: RadioRepoVisibility;
  cause: string | null;
  causeCode: string | null;
}> => {
  try {
    const read = await getOneGhRepoVisibility(
      { repo: input.record.repo },
      context,
    );
    return {
      visibility: read.visibility,
      cause: read.visibility === 'unreadable' ? read.cause : null,
      causeCode: null,
    };
  } catch (error) {
    // only a gh fault is an answer here; any other throw is a defect
    if (!asRadioUpstreamFault({ error })) throw error;
    const text = asRadioUpstreamFaultText({ error });
    return {
      visibility: 'unreadable',
      cause: asRadioFaultCauseLine({ text }),
      causeCode: asRadioUpstreamReason({ message: text }),
    };
  }
};
