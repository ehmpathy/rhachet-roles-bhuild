import type { RadioGhSendLimit } from '../../../domain.objects/RadioContext';
import { RADIO_GH_SEND_TIMEOUT } from './RADIO_GH_SEND_TIMEOUT';
import { RadioGhSendTimeoutError } from './RadioGhSendTimeoutError';

/**
 * .what = the timeout one gh call gets: its own bound, cut to what the send has left
 * .why = one send makes several gh calls (a lookup, a create; a lookup, an edit, a close);
 *        a per-call bound alone lets a slow send run calls × timeout, past the drain lease.
 *        each call gets min(per-call bound, time left on the send deadline)
 *
 * .note = no limit (a push outside a drain): the per-call default alone. a send with no
 *         time left fails at once, before the call starts, as a send timeout
 */
export const getOneGhCallTimeout = (input: {
  limit: RadioGhSendLimit | null;
}): { milliseconds: number } => {
  // outside a drain, each call keeps the default bound
  if (!input.limit) return RADIO_GH_SEND_TIMEOUT;
  // a send already past its deadline starts no further call; exec takes whole milliseconds
  const left = Math.floor(input.limit.getMillisecondsLeft());
  if (left < 1)
    throw new RadioGhSendTimeoutError(
      'gh send ran past its deadline before its next call (etimedout); the record stays held for the next drain',
      { perCall: input.limit.perCall },
    );
  return { milliseconds: Math.min(input.limit.perCall.milliseconds, left) };
};
