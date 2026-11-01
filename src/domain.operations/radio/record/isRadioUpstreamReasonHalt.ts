/**
 * .what = does a fault of this reason halt the drain
 * .why = a rate limit binds the token and an outage binds github, so every record behind
 *        would meet the same wall: the drain halts there, oldest first holds (#511, F1).
 *        any other fault binds one record (its issue, its repo under its auth), so that
 *        record is set aside and the rest still deliver (no head-of-line block)
 */
export const isRadioUpstreamReasonHalt = (input: { reason: string }): boolean =>
  input.reason === 'upstream:rate-limit' ||
  input.reason === 'upstream:transient';
