import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { asRadioAuthBotMissWhy } from '@src/domain.operations/radio/auth/asRadioAuthBotMissWhy';
import type { RadioAuthFallback } from '@src/domain.operations/radio/auth/RadioAuthFallback';

import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

/**
 * .what = the line for one fallback: which credential delivered, and why the bot token did not
 * .why = a seat must see whose identity a task went out under; a kind, never a token value
 */
const asRadioAuthFallbackLine = (input: {
  fallback: RadioAuthFallback;
}): string =>
  `🦫 delivered via the ${input.fallback.kind}; ${asRadioAuthBotMissWhy({ bot: input.fallback.bot })}`;

/**
 * .what = one line per distinct (credential kind, reason) among the records delivered under
 *         the ambient credential, in first-seen order; none when no fallback fired
 * .why = a push or drain that borrowed the box's credential says so once, not once per record
 */
export const asRadioAuthFallbackNotice = (input: {
  fates: (RadioTaskRecordFate | { fate: 'landed'; record: RadioTaskRecord })[];
}): string[] => {
  const lines = input.fates.flatMap((fate) =>
    fate.fate === 'delivered' && fate.fallback
      ? [asRadioAuthFallbackLine({ fallback: fate.fallback })]
      : [],
  );
  return [...new Set(lines)];
};
