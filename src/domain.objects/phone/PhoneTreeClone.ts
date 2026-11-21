/**
 * .what = whether a clone can take a text now
 * .note = LIVE answers a say; DEAF is an active clone with no socket; DEAD is gone
 */
export const PHONE_REACH_STATES = ['LIVE', 'DEAD', 'DEAF'] as const;
export type PhoneReachState = (typeof PHONE_REACH_STATES)[number];

/**
 * .what = one clone enrolled in a tree, as the phone sees it
 * .why = the phone's own vocabulary for a tree's roster, so domain code never reads the rhachet
 *        adapter's types; the sdk's roster fits this shape at the boundary
 */
export interface PhoneTreeClone {
  /**
   * the clone's full serial, rhachet's own key for it
   */
  serial: string;

  /**
   * the clone's slug; null for a clone named only by its serial
   */
  slug: string | null;

  /**
   * whether it can take a text now
   */
  reachState: PhoneReachState;
}
