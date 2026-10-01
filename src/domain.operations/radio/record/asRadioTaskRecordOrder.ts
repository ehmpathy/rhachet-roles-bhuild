import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

/**
 * .what = compare two strings by code unit, never by host locale
 * .why = the drain order must read the same on every machine
 */
const asCodeUnitOrder = (input: { a: string; b: string }): number => {
  if (input.a < input.b) return -1;
  if (input.a > input.b) return 1;
  return 0;
};

/**
 * .what = the order two records drain in: oldest first
 * .why = the drain delivers in the order the pushes were made. heldAt leads;
 *        heldSeq breaks a same-second tie; the key makes the order total
 */
export const asRadioTaskRecordOrder = (input: {
  a: { record: RadioTaskRecord };
  b: { record: RadioTaskRecord };
}): number =>
  asCodeUnitOrder({ a: input.a.record.heldAt, b: input.b.record.heldAt }) ||
  input.a.record.heldSeq - input.b.record.heldSeq ||
  asCodeUnitOrder({ a: input.a.record.key, b: input.b.record.key });
