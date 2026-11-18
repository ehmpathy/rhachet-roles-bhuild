/**
 * .what = the reasons another auth may cure: the robot may not write here, cannot see the
 *         repo, or holds no usable token
 * .why = these name `queue set --auth as-human` as their fix; a wall or a gate does not
 */
const REASONS_CURED_BY_AUTH = new Set([
  'upstream:access',
  'upstream:not-found',
  'upstream:401',
  'upstream:auth',
]);

/**
 * .what = may another auth cure a fault of this reason
 * .why = one answer, shared by the fix lines of a set-aside record and by the promise gate,
 *        which tells a visibility read the robot could not make from one no auth could
 */
export const isRadioUpstreamReasonCuredByAuth = (input: {
  reason: string | null;
}): boolean => input.reason !== null && REASONS_CURED_BY_AUTH.has(input.reason);
