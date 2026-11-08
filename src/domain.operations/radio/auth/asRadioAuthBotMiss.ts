import type { RadioAuthBotMiss } from './RadioAuthFallback';

/**
 * .what = the fix for a bot token github refused: replace it at its keyrack coordinate
 * .why = the default auth reads one well-known coordinate (getGithubTokenByAuthArg)
 */
const FIX_BOT_REFUSED =
  'replace the robot token: rhx keyrack set --owner ehmpath --key EHMPATH_BEAVER_GITHUB_TOKEN --env prep';

/**
 * .what = why the ehmpath bot token did not send, from its derive fault or its send refusal
 * .why = the fallback line names the reason; a fail that names both credentials names the fix
 *
 * .note = a derive fault carries the keyrack nudge (getKeyrackAuthFailureMessage): its first
 *         line, with the error class header cut, is the headline, so the both-failed tree holds
 *         one header; its `• or …` bullet is the bot token's own fix. its
 *         `--auth as-human` bullet is dropped, since the fallback already tried the ambient
 */
export const asRadioAuthBotMiss = (
  input:
    | { fault: { message: string } }
    | { refusal: 'upstream:401' | 'upstream:access' },
): RadioAuthBotMiss => {
  // github refused the token it was sent with
  if ('refusal' in input) {
    const code = input.refusal === 'upstream:401' ? '401' : '403';
    return {
      reason: code === '401' ? 'refused (401)' : 'refused (403)',
      headline: `github refused the ehmpath bot token (${code})`,
      fix: FIX_BOT_REFUSED,
    };
  }

  // keyrack did not grant the token
  const lines = input.fault.message.split('\n');
  const headline =
    lines[0]?.trim().replace(/^\S+ \w*Error: /, '') ||
    'the ehmpath bot token was not granted';
  const fixLine = lines.find((line) => line.trim().startsWith('• or '));
  const fix = fixLine
    ? fixLine.trim().replace(/^• or /, '')
    : 'rhx keyrack status --owner ehmpath';
  return { reason: asRadioAuthBotMissStatus({ headline }), headline, fix };
};

/**
 * .what = the keyrack status a derive fault names, as a fallback reason
 * .why = absent, locked, and blocked each owe a different fix; a seat must see which one hit
 * .note = the header reads `... (status: <status>)` (getKeyrackAuthFailureMessage)
 */
const asRadioAuthBotMissStatus = (input: {
  headline: string;
}): 'absent' | 'locked' | 'blocked' | 'not granted' => {
  const status = /\(status: (\w+)\)/.exec(input.headline)?.[1];
  if (status === 'absent' || status === 'locked' || status === 'blocked')
    return status;
  return 'not granted';
};
