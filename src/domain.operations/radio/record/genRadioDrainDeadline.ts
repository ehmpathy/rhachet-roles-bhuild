import { asRadioDrainLeaseMargin } from './asRadioDrainLeaseMargin';

/**
 * .what = the deadline of one drain, started when it takes the lock: how long is left
 * .why = the lock is a lease, not a fence: once the lease runs out the lock frees while the
 *        drain still runs, and a second drain could then send the same record (X2). every
 *        step of a drain that can stall — the auth derive, a shell, each gh call — takes at
 *        most what this deadline has left, and no record starts past it, so the drain ends
 *        inside its lease by construction, whichever step stalls
 *
 * .note = reads the process's monotonic clock (hrtime), in memory only; no time is stored
 *         or written. hrtime, not Date: a test that pins the wall clock must not stall it
 */
export type RadioDrainDeadline = { getMillisecondsLeft: () => number };

/**
 * .what = a drain deadline, started now, for a lock held under the given lease
 * .why = the lock owns the one deadline every step of its drain reads
 */
export const genRadioDrainDeadline = (input: {
  lease: { milliseconds: number };
}): RadioDrainDeadline => {
  // the drain may run for the lease less its margin
  const span =
    input.lease.milliseconds - asRadioDrainLeaseMargin(input).milliseconds;
  const deadlineNs =
    process.hrtime.bigint() + BigInt(Math.round(span * 1_000_000));

  // each read reports what is left; below zero once the deadline passed
  return {
    getMillisecondsLeft: () =>
      Number(deadlineNs - process.hrtime.bigint()) / 1_000_000,
  };
};
