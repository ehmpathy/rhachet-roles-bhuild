import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';

import { isRadioPromiseHoldReason } from '../promise/isRadioPromiseHoldReason';
import type { RadioPromiseHoldReason } from '../promise/RadioPromiseHoldReason';

/**
 * .what = did the promise gate drop this record: a push's own text, refused for its promise
 * .why = a drop by a human (`queue del`) and a drop by the gate share one status; only the
 *        reason tells them apart, and every reader must tell them apart the same way
 */
export const isRadioTaskRecordDroppedForPromise = <
  TRecord extends Pick<RadioTaskRecord, 'recordStatus' | 'reason'>,
>(
  record: TRecord,
): record is TRecord & { reason: RadioPromiseHoldReason } =>
  record.recordStatus === RadioTaskRecordStatus.DROPPED &&
  isRadioPromiseHoldReason(record.reason);
