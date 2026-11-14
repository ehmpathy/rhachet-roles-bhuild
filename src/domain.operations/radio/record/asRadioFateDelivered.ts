import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import type {
  RadioTaskRecordFate,
  RadioTaskRecordSent,
} from './RadioTaskRecordFate';

/**
 * .what = the delivered fate of a record, from what its send landed
 * .why = a task send carries its task into the fate; a comment send carries its url. one named
 *        map, so the settle path reads as narrative and each variant is spelled out
 */
export const asRadioFateDelivered = (input: {
  record: RadioTaskRecord;
  sent: RadioTaskRecordSent;
}): Extract<RadioTaskRecordFate, { fate: 'delivered' }> => {
  // a comment landed on a thread
  if ('comment' in input.sent)
    return {
      fate: 'delivered',
      record: input.record,
      comment: input.sent.comment,
      outcome: input.sent.outcome,
    };

  // a task landed
  return {
    fate: 'delivered',
    record: input.record,
    task: input.sent.task,
    outcome: input.sent.outcome,
  };
};
