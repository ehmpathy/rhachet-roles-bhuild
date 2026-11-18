import { RadioChannel } from '@src/domain.objects/RadioChannel';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

/**
 * .what = whether a record carries text bound for gh.issues with no promise on it
 * .why = such a record goes to a public repo only with `drain --promise`; a surface that reads no
 *        visibility (an amend, the held list) must say so, never that a plain drain sends it
 */
export const isRadioTaskRecordTextUnvouched = (input: {
  record: RadioTaskRecord;
}): boolean =>
  input.record.via === RadioChannel.GH_ISSUES &&
  (input.record.title !== null || input.record.description !== null) &&
  input.record.promise === null;
