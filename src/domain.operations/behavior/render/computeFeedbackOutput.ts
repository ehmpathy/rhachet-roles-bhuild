/**
 * .what = compute feedback output with tree format
 * .why = friendly output for give.feedback skill
 *
 * .note = `options.color` gates the ansi dim escapes.
 *
 *   🔴 the escapes DIM a tip on a terminal and become literal `[2m` / `[0m`
 *   noise the moment stdout is captured — a pipe, a ci log, a jest snapshot.
 *   a snapshot is read by a human to vibecheck a render, so a control code
 *   baked into it is a visual blemish
 *   (ergonomist `rule.forbid.snapshot-visual-blemishes`).
 *
 *   the caller owns the signal, because this stays a pure compute*: the cli
 *   passes `process.stdout.isTTY`. the default is `true`, so a caller that
 *   renders for a human may omit it.
 */
export const computeFeedbackOutput = (
  input: {
    feedbackFilename: string;
    artifact: string;
    opener?: string;
  },
  options?: { color?: boolean },
): string => {
  const color = options?.color ?? true;
  const dim = color ? '\x1b[2m' : '';
  const reset = color ? '\x1b[0m' : '';

  // the last line is a confirmation when an opener ran, a tip when it did not
  const lineLast = input.opener
    ? `   └─ opened in ${input.opener}`
    : `   └─ ${dim}tip: use --open nvim to open automatically${reset}`;

  // build output lines
  return [
    `🦫 wassup?`,
    '', // blank line between mascot and artifact
    `🌲 feedback.give --against ${input.artifact}`,
    `   ├─ ✓ ${input.feedbackFilename}`,
    `   ├─ ${dim}tip: use --version ++ to create a new version${reset}`,
    lineLast,
  ].join('\n');
};
