import { DETAIL_REPUSHED_MID_SEND } from './asRadioFateRepushedMidSend';
import { DETAIL_UNREACHED_BY_BUDGET } from './asRadioFateUnreachedByBudget';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = is this a held fate whose record this drain never sent
 * .why = such a record still carries the prior drain's reason on disk; a render must not
 *        show that stale fault, nor an amend for a fault this drain never met
 *
 * .note = keyed on the two fates' own exported details, so a third such fate adds itself here
 */
export const isRadioFateUnattempted = (input: {
  fate: RadioTaskRecordFate;
}): boolean =>
  input.fate.fate === 'held' &&
  (input.fate.detail === DETAIL_UNREACHED_BY_BUDGET ||
    input.fate.detail === DETAIL_REPUSHED_MID_SEND);
