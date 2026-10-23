import type { PhoneReachState } from '@src/domain.objects/phone/PhoneTreeClone';

/**
 * .what = the reason a text waits on a peer that can not take a say yet
 * .why = the roster path and the say path both meet a DEAD or DEAF peer; one transformer writes
 *        the reason, so a waited text reads one way on either path. the say path adds the cause
 *        rhachet names; the roster carries none
 */
export const asPhoneReasonOfPeerReach = (input: {
  reachState: PhoneReachState;
  reachCause: string | null;
}): string =>
  [`peer clone is ${input.reachState}`, input.reachCause]
    .filter(Boolean)
    .join(': ');
