/**
 * .what = the most time one gh call may take before it is killed
 * .why = a drain bounds when it starts a send (its send budget), never how long a send runs;
 *        a gh call that stalls with no bound would outlast the drain lock's lease, and a
 *        second drain could then send the same record (X2). one send makes several calls,
 *        so a drain also cuts each call to its send deadline (RADIO_GH_SEND_DEADLINE), and
 *        the drain lock's lease is derived from that deadline
 */
export const RADIO_GH_SEND_TIMEOUT: { milliseconds: number } = {
  milliseconds: 60_000,
};
