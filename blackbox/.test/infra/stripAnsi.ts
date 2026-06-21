/**
 * .what = strip ANSI escape codes from a string
 * .why = ensure consistent snapshots across terminal environments
 *
 * .note = different terminals (CI vs local) produce different ANSI codes
 *         for emoji space adjustments (via emoji-space-shim). strip ANSI codes
 *         to make snapshots deterministic.
 */
export const stripAnsi = (str: string): string =>
  str.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    '',
  );

/**
 * .what = sanitize output for deterministic snapshots
 * .why = filter environment-specific noise from test output
 *
 * .note = local environments may produce bash_aliases errors and other
 *         system-specific output that differs from CI. filter these
 *         lines to make snapshots portable.
 */
export const sanitizeOutput = (str: string): string => {
  const lines = stripAnsi(str).split('\n');
  const filtered = lines.filter(
    (line) =>
      !line.includes('.bash_aliases:') && !line.includes('.bashrc:'),
  );
  return filtered.join('\n');
};
