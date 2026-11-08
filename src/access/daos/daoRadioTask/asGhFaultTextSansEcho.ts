/**
 * .what = the text a gh fault is classified from: what gh or github said, never the command
 *         line the exec message echoes
 * .why = an exec message echoes the argv, title included; a task titled "read GH_TOKEN before
 *        gh auth login" must not turn a rate limit into a 401, which would resend it under the
 *        ambient credential (#513)
 *
 * .note = cuts every echo of the exec's own `cmd` (else the command as the caller joined it)
 */
export const asGhFaultTextSansEcho = (input: {
  message: string;
  stderr: string;
  cmd: string | null;
  command: string;
}): string => {
  const echo = input.cmd ?? input.command;
  const said = input.message.split(echo).join('');
  return [said, input.stderr].filter((part) => part.length).join('\n');
};
