import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = the line that names a `drain --auth` override, or null when naught went out under it
 * .why = an override reaches every record the drain sends, so the human must see it; but a shut
 *        gate or an empty queue sends naught, and a claim of a send there would be false
 *
 * .note = a drain sent under the override iff some fate is not held at a gate: a delivery or a
 *         refusal was a send, and a record held behind a halt, behind an earlier update to its
 *         issue, or past the send budget exists only after an earlier record went out
 */
export const asRadioDrainAuthNotice = (input: {
  fates: RadioTaskRecordFate[];
  authOverride: string | null;
}): string | null => {
  if (!input.authOverride) return null;
  const isAnySent = input.fates.some(
    (fate) => fate.fate !== 'held' || fate.lift === null,
  );
  if (!isAnySent) return null;
  return `🦫 this drain sent under --auth ${input.authOverride}`;
};
