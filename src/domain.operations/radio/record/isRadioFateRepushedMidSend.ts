import { DETAIL_REPUSHED_MID_SEND } from './asRadioFateRepushedMidSend';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = is this the fate of a record a re-push rewrote while its prior copy was sent
 * .why = that prior copy reached upstream, so a render must never read it as not attempted
 */
export const isRadioFateRepushedMidSend = (input: {
  fate: RadioTaskRecordFate;
}): boolean =>
  input.fate.fate === 'held' && input.fate.detail === DETAIL_REPUSHED_MID_SEND;
