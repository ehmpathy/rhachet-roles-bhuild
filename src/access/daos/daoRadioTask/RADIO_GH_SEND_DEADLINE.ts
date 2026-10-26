/**
 * .what = the most time one send (all its gh calls) may take before its next call is refused
 * .why = one send makes several gh calls (a lookup and a create; a lookup, an edit, and a
 *        close), so the per-call bound (RADIO_GH_SEND_TIMEOUT) alone would let a slow send
 *        run calls × timeout. the drain lock lease is derived from this bound, not the per-call one
 */
export const RADIO_GH_SEND_DEADLINE: { milliseconds: number } = {
  milliseconds: 90_000,
};
