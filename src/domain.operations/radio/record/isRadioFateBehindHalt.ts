import { isRadioUpstreamReasonHalt } from './isRadioUpstreamReasonHalt';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = is this fate a record held unsent, in line behind the record that hit a wall
 * .why = the halter and every record behind it carry one halt reason; only the halter met
 *        the wall, so the drain output must tell the two apart
 */
export const isRadioFateBehindHalt = (input: {
  fate: RadioTaskRecordFate;
}): boolean =>
  input.fate.fate === 'held' &&
  !input.fate.halt &&
  input.fate.record.reason !== null &&
  isRadioUpstreamReasonHalt({ reason: input.fate.record.reason });
