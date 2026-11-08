/**
 * .what = the kind of ambient credential a box holds, in the order gh itself reads them
 * .why = a fallback line names the kind, never the token value
 */
export type GithubAuthAmbientKind =
  | 'GH_TOKEN env'
  | 'GITHUB_TOKEN env'
  | 'gh login';

/**
 * .what = why the ehmpath bot token did not send, with the fix for it
 * .why = a fallback line names the reason; a fail that names both credentials names the fix
 */
export type RadioAuthBotMiss = {
  reason:
    | 'absent'
    | 'locked'
    | 'blocked'
    | 'not granted'
    | 'refused (401)'
    | 'refused (403)';
  headline: string;
  fix: string;
};

/**
 * .what = a send that went out under the ambient credential, because the bot token did not
 * .why = the clis print one line per distinct (kind, reason), so a seat sees whose identity sent
 */
export type RadioAuthFallback = {
  kind: GithubAuthAmbientKind;
  bot: RadioAuthBotMiss;
};
