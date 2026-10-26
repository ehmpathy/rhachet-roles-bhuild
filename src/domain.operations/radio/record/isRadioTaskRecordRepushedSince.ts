import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

/**
 * .what = the fields that are no part of a push's request: the drain's fate fields, plus heldSeq
 * .why = enumerate the few, so a request field added later is guarded by default
 *
 * .note = heldSeq is minted once at the first push and kept on every later one (see
 *         asRadioTaskRecordFromPush), so no re-push can change it; it is left out of the compare
 *         because it is fixed, not because the drain owns it
 */
const FIELDS_OF_FATE = new Set<string>([
  'recordStatus',
  'reason',
  'deliveredExid',
  'heldSeq',
]);

/**
 * .what = the request half of a record: every field but the drain's own, as one comparable string
 * .why = two records carry the same request iff these strings are equal
 */
const asRadioTaskRecordRequestText = (input: {
  record: RadioTaskRecord;
}): string =>
  JSON.stringify(
    Object.entries(input.record)
      .filter(([name]) => !FIELDS_OF_FATE.has(name))
      .sort(([a], [b]) => a.localeCompare(b)),
  );

/**
 * .what = did a push rewrite this record's request since the drain read it
 * .why = the drain sends the copy it read; a re-push that lands before it settles carries a
 *        request the send never saw, so the drain must not settle it as though it did
 *
 * .note = compares every field but the fate (recordStatus, reason, deliveredExid), which the
 *         drain owns, and heldSeq, which is fixed; so a settle's own change is never read as a re-push
 */
export const isRadioTaskRecordRepushedSince = (input: {
  read: RadioTaskRecord;
  current: RadioTaskRecord;
}): boolean =>
  asRadioTaskRecordRequestText({ record: input.read }) !==
  asRadioTaskRecordRequestText({ record: input.current });
