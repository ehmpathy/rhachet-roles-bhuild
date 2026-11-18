import { RadioChannel } from '@src/domain.objects/RadioChannel';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { isRadioTaskWithText } from './isRadioTaskWithText';
import { RADIO_PROMISE_PUBLIC_REPO } from './RADIO_PROMISE_PUBLIC_REPO';

/**
 * .what = does this record owe a promise before it may go out, should its repo read public
 * .why = only text can leak: a gh.issues create, or an update that sets a title or a body.
 *        a status-only update and an os.fileops record carry no text to a public page
 *
 * .note = promised only by the exact literal, on the record or as the drain's override; a
 *         hand-edited record with any other string is still owed (fail closed)
 */
export const isRadioPromiseOwedByRecord = (input: {
  record: Pick<RadioTaskRecord, 'via' | 'title' | 'description' | 'promise'>;
  promiseOverride: string | null;
}): boolean => {
  // only a public page leaks
  if (input.record.via !== RadioChannel.GH_ISSUES) return false;

  // only text leaks
  if (!isRadioTaskWithText(input.record)) return false;

  // a vouch on the record, or the drain's, settles it
  const isPromised =
    input.record.promise === RADIO_PROMISE_PUBLIC_REPO ||
    input.promiseOverride === RADIO_PROMISE_PUBLIC_REPO;
  return !isPromised;
};
