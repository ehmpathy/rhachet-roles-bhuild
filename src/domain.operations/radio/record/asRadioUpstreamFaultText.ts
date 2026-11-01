import { HelpfulError } from 'helpful-errors';

import { asExecErrorMessage } from '@src/infra/shell/asExecErrorMessage';

/**
 * .what = the text a send fault is classified from: what github or the network said,
 *         never the command the radio echoed
 * .why = an exec message echoes the whole command line, title and body path included, and
 *        an error's metadata may carry it too; a task titled "handle rate limit" must not
 *        pick its own fault class (asRadioUpstreamReason reads phrases)
 *
 * .note = a HelpfulError: its message with metadata redacted. an exec-shaped error: its
 *         message with every echo of its `cmd` cut, plus its stderr. all else: its message
 */
export const asRadioUpstreamFaultText = (input: { error: unknown }): string => {
  // our own errors: the message we wrote, never the metadata we attached
  if (input.error instanceof HelpfulError)
    return input.error.redact(['metadata']).message;

  // an exec error, duck-typed across realms: cut the echoed command, keep what it said
  const message = asExecErrorMessage({ error: input.error });
  const fields =
    typeof input.error === 'object' && input.error !== null
      ? (input.error as { cmd?: unknown; stderr?: unknown }) // duck-type: cross-realm node error
      : {};
  const cmd = typeof fields.cmd === 'string' ? fields.cmd : null;
  const stderr = typeof fields.stderr === 'string' ? fields.stderr : '';
  const said = cmd ? message.split(cmd).join('') : message;
  return [said, stderr].filter((part) => part.length).join('\n');
};
