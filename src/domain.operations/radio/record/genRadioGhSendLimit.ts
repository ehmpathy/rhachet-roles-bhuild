import type { RadioGhSendLimit } from '@src/domain.objects/RadioContext';

/**
 * .what = the time bound on one send, started now: a cap per gh call, and a deadline
 * .why = the drain lease must outlast the whole send, not one call of it; each gh call is
 *        cut to what the send has left (getOneGhCallTimeout)
 *
 * .note = reads the process's monotonic clock (hrtime), in memory only; no time is stored
 *         or written. hrtime, not Date: a test that pins the wall clock must not stall it
 */
export const genRadioGhSendLimit = (input: {
  perCall: { milliseconds: number };
  perSend: { milliseconds: number };
}): RadioGhSendLimit => {
  const startedNs = process.hrtime.bigint();
  const deadlineNs =
    startedNs + BigInt(Math.round(input.perSend.milliseconds * 1_000_000));
  return {
    perCall: input.perCall,
    getMillisecondsLeft: () =>
      Number(deadlineNs - process.hrtime.bigint()) / 1_000_000,
  };
};
