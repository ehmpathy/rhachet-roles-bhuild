import { ConstraintError } from 'helpful-errors';

import { asRadioAuthBotMissWhy } from './asRadioAuthBotMissWhy';
import type {
  GithubAuthAmbientKind,
  RadioAuthBotMiss,
} from './RadioAuthFallback';

/**
 * .what = the fix for an ambient credential github refused, by its kind
 * .why = a gh login is fixed by a fresh login; an env token at its source
 */
const asAmbientRefusedFix = (input: { kind: GithubAuthAmbientKind }): string =>
  input.kind === 'gh login'
    ? 'gh auth login'
    : `check the token in ${input.kind.replace(/ env$/, '')}: its scopes and expiry`;

/**
 * .what = the fault when neither the ehmpath bot token nor the ambient credential could send
 * .why = the default auth tried both; the caller needs both named, each with its own fix
 *
 * .note = names credential kinds only, never a token value
 */
export const asRadioAuthBothFailedError = (input: {
  bot: RadioAuthBotMiss;
  ambient:
    | { state: 'absent' }
    | { state: 'refused'; kind: GithubAuthAmbientKind; code: '401' | '403' };
}): ConstraintError => {
  const ambientHeadline =
    input.ambient.state === 'absent'
      ? 'no GH_TOKEN env, no GITHUB_TOKEN env, no gh login'
      : `github refused the ${input.ambient.kind} (${input.ambient.code})`;
  const ambientFix =
    input.ambient.state === 'absent'
      ? 'gh auth login'
      : asAmbientRefusedFix({ kind: input.ambient.kind });
  // the headline names both credentials and why each missed: a drain prints the headline
  // alone, so it must stand on its own
  const ambientWhy =
    input.ambient.state === 'absent'
      ? 'no ambient credential was found'
      : ambientHeadline;
  const headline = `github auth failed: ${asRadioAuthBotMissWhy({ bot: input.bot })}, and ${ambientWhy}`;

  // one bullet per credential, each with its fix beneath: the held output renders each
  // bullet as its own tree line (asRadioErrorHintLines), so the body draws no outer glyph
  return new ConstraintError(
    [
      headline,
      `  • the ehmpath bot token: ${input.bot.headline}`,
      `  └─ fix: ${input.bot.fix}`,
      `  • the ambient credential: ${ambientHeadline}`,
      `  └─ fix: ${ambientFix}`,
    ].join('\n'),
  );
};
