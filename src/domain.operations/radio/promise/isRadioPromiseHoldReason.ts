import {
  RADIO_PROMISE_HOLD_REASONS,
  type RadioPromiseHoldReason,
} from './RadioPromiseHoldReason';

/**
 * .what = is this record reason one the promise gate set
 * .why = a record held for its promise awaits a vouch, not a lift or a retry, so every
 *        surface that reads a reason must tell it apart; an exact match, never a part of a word
 *
 * .note = a bare arg, not `{ reason }`: a type guard narrows only the value it is handed, and
 *         callers read the reason off a record they keep
 */
export const isRadioPromiseHoldReason = (
  reason: string | null,
): reason is RadioPromiseHoldReason =>
  reason !== null &&
  (RADIO_PROMISE_HOLD_REASONS as readonly string[]).includes(reason);
