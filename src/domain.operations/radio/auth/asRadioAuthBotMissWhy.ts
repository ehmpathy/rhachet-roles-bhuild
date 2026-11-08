import type { RadioAuthBotMiss } from './RadioAuthFallback';

/**
 * .what = why the ehmpath bot token did not send, as a clause a line can carry
 * .why = the fallback line and the both-failed headline say it the same way
 *
 * .note = a refusal's headline already reads "github refused the ehmpath bot token (401|403)";
 *         a derive fault names the keyrack status it hit (absent, locked, blocked)
 */
export const asRadioAuthBotMissWhy = (input: {
  bot: RadioAuthBotMiss;
}): string =>
  input.bot.reason.startsWith('refused')
    ? input.bot.headline
    : `the ehmpath bot token was ${input.bot.reason}`;
