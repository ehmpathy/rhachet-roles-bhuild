/**
 * .what = the one line of an upstream fault's own text a drain prints beside its code
 * .why = a code alone (`upstream:fault`) cannot tell a human why a record was set aside;
 *        the upstream's first words can (case=1: the gh error, verbatim)
 *
 * .note = only the first non-blank line, so a multi-line stderr never floods the tree
 * .note = an exec failure leads with `Command failed: <the command>`, which names our own
 *         call (and a temp path that differs each run), not the upstream's words; that header
 *         is skipped for the first line after it, and kept only when naught follows
 */
export const asRadioFaultDetailLine = (input: {
  detail: string | null;
}): string | null => {
  const lines = (input.detail ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const lineUpstream =
    lines.find((line) => !line.includes('Command failed:')) ?? lines[0];
  if (!lineUpstream) return null;
  return `fault: ${lineUpstream}`;
};
