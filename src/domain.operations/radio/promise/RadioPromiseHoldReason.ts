/**
 * .what = the closed set of reasons the promise gate holds a record on
 * .why = each reason keys its own detail, fix lines, and state; a closed set lets every
 *        reason-keyed map be an exhaustive switch, so a fourth reason fails the type check
 *
 * .note = public-repo:unpromised      = the repo reads public, and the record carries no promise
 *         public-repo:unreadable      = the visibility read failed; treated as public
 *         public-repo:unreadable-auth = the read failed on a fault another auth may cure
 */
export const RADIO_PROMISE_HOLD_REASONS = [
  'public-repo:unpromised',
  'public-repo:unreadable',
  'public-repo:unreadable-auth',
] as const;

export type RadioPromiseHoldReason =
  (typeof RADIO_PROMISE_HOLD_REASONS)[number];
