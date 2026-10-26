import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

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
 * .what = the place of a status in the task lifecycle: queued, then claimed, then delivered
 * .why = an update with no status (a body edit) ranks first, beside queued
 */
const RADIO_TASK_STATUS_RANK: Record<RadioTaskStatus, number> = {
  [RadioTaskStatus.QUEUED]: 0,
  [RadioTaskStatus.CLAIMED]: 1,
  [RadioTaskStatus.DELIVERED]: 2,
};

/**
 * .what = the task a record acts on: via|repo|exid for an update, the record's own key for a create
 * .why = updates to one task must sort together so their lifecycle order applies; an exid is
 *        scoped per channel, so exid 7 over os.fileops and #7 over gh.issues are two tasks
 */
const asRadioTaskRecordTaskGroup = (input: {
  record: RadioTaskRecord;
}): string =>
  input.record.exid === null
    ? input.record.key
    : `${input.record.via}|${input.record.repo.owner}/${input.record.repo.name}|${input.record.exid}`;

/**
 * .what = the lifecycle rank of a record's status
 * .why = within one task, a claim must go before a deliver, or upstream refuses the deliver
 */
const asRadioTaskRecordStatusRank = (input: {
  record: RadioTaskRecord;
}): number =>
  input.record.status ? RADIO_TASK_STATUS_RANK[input.record.status] : 0;

/**
 * .what = the order two records drain in: first pushed, first delivered
 * .why = the drain delivers in the order the pushes were made. one lexicographic tuple
 *        (heldSeq, task group, status rank, key) makes the order total, so it reads the same
 *        for any readdir order; where two seqs tie (a legacy per-dir seq, or two mints at one
 *        instant), updates to one task sort together in lifecycle order
 */
export const asRadioTaskRecordOrder = (input: {
  a: { record: RadioTaskRecord };
  b: { record: RadioTaskRecord };
}): number =>
  input.a.record.heldSeq - input.b.record.heldSeq ||
  asCodeUnitOrder({
    a: asRadioTaskRecordTaskGroup({ record: input.a.record }),
    b: asRadioTaskRecordTaskGroup({ record: input.b.record }),
  }) ||
  asRadioTaskRecordStatusRank({ record: input.a.record }) -
    asRadioTaskRecordStatusRank({ record: input.b.record }) ||
  asCodeUnitOrder({ a: input.a.record.key, b: input.b.record.key });
