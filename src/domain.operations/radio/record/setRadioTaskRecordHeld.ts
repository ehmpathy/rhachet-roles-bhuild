import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioFateRepushedMidSend } from './asRadioFateRepushedMidSend';
import { isRadioTaskRecordRepushedSince } from './isRadioTaskRecordRepushedSince';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import { setRadioTaskRecordSettled } from './setRadioTaskRecordSettled';

/**
 * .what = hold one record the send could not deliver: settle its change, then report its fate
 * .why = one writer for every send-side hold (an auth fault, a request fault, a read wall, a
 *        promise hold), so the re-push guard is written once: a re-push that landed since the
 *        drain read the record is left as the re-push wrote it, and reported as re-pushed
 *
 * .note = halt rides on the re-pushed fate too: a wall binds every send, whoever pushed last
 */
export const setRadioTaskRecordHeld = (input: {
  record: RadioTaskRecord;
  dir: string;
  change: Partial<RadioTaskRecord>;
  detail: string | null;
  halt: boolean;
}): Extract<RadioTaskRecordFate, { fate: 'held' }> => {
  // settle the change, unless a re-push rewrote the record since the read
  const settled = setRadioTaskRecordSettled({
    dir: input.dir,
    record: input.record,
    change: input.change,
  });

  // a re-push since the read is a new request: its fate is unknown, not this hold
  if (isRadioTaskRecordRepushedSince({ read: input.record, current: settled }))
    return {
      ...asRadioFateRepushedMidSend({ record: settled, dir: input.dir }),
      halt: input.halt,
    };
  return {
    fate: 'held',
    record: settled,
    dir: input.dir,
    lift: null,
    detail: input.detail,
    halt: input.halt,
  };
};
