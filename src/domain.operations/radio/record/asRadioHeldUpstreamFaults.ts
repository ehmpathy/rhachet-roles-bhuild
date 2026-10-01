import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

/**
 * .what = the distinct upstream faults that hold records whose gate is open
 * .why = a record held on an upstream fault (a rejected token, a rate limit) is not freed
 *        by an open gate alone; the reminder must name the fault, never claim the radio
 *        is all that stands in the way
 */
export const asRadioHeldUpstreamFaults = (input: {
  held: { record: RadioTaskRecord; lift: string | null }[];
}): string[] => [
  ...new Set(
    input.held.flatMap(({ record, lift }) =>
      !lift && record.reason?.startsWith('upstream:') ? [record.reason] : [],
    ),
  ),
];
