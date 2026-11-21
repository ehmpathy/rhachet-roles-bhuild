import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { isRadioTaskRecordRequeuedByPush } from './isRadioTaskRecordRequeuedByPush';

/**
 * .what = the extant record whose fate a re-push keeps, or null when the push queues it afresh
 * .why = a held record keeps its place and a delivered one stays delivered; a new push, or one
 *        that re-runs a refusal or a drop, starts QUEUED with no reason
 */
export const asRadioTaskRecordFateKept = (input: {
  before: RadioTaskRecord | null;
  push: { description: string | null };
}): RadioTaskRecord | null => {
  if (!input.before) return null;
  if (isRadioTaskRecordRequeuedByPush(input)) return null;
  return input.before;
};
