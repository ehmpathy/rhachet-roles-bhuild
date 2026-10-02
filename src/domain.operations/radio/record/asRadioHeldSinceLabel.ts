import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

/**
 * .what = when a record was first held, as a short utc stamp: `held since 2026-09-29T09:14Z`
 * .why = a drained line says how long the task waited (case=3); utc keeps the read
 *        one way on every machine, and the date keeps a days-old task legible
 */
export const asRadioHeldSinceLabel = (input: {
  record: RadioTaskRecord;
}): string => `held since ${input.record.heldAt.slice(0, 16)}Z`;
