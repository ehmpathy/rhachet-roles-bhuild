/**
 * .what = the slack a lease keeps past the drain deadline: 60s, or a quarter of a short lease
 * .why = covers the record writes and the lock release that follow the last step; a short
 *        lease (a test) keeps most of itself for the drain
 */
export const asRadioDrainLeaseMargin = (input: {
  lease: { milliseconds: number };
}): { milliseconds: number } => ({
  milliseconds: Math.min(60_000, input.lease.milliseconds / 4),
});
