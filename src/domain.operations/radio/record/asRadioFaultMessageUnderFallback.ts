import { asRadioAuthBotMissWhy } from '@src/domain.operations/radio/auth/asRadioAuthBotMissWhy';
import type { RadioAuthFallback } from '@src/domain.operations/radio/auth/RadioAuthFallback';

/**
 * .what = a held fault's message, led by the credential it was sent under when that was the
 *         ambient one; else the message as is
 * .why = a fault that is no refusal (a not-found, say) after a fallback must still say whose
 *        identity the send went out under, or a seat cannot tell why it failed (#513)
 *
 * .note = the lead sits on the first line, since a drain shows a fault by its first line alone
 */
export const asRadioFaultMessageUnderFallback = (input: {
  message: string;
  sentUnder: RadioAuthFallback | null;
}): string =>
  input.sentUnder
    ? `sent via the ${input.sentUnder.kind} (${asRadioAuthBotMissWhy({ bot: input.sentUnder.bot })}): ${input.message}`
    : input.message;
