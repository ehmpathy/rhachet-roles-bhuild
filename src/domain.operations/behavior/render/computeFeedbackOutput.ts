/**
 * .what = compute feedback output with tree format
 * .why = friendly output for give.feedback skill
 */
export const computeFeedbackOutput = (input: {
  feedbackFilename: string;
  artifact: string;
  opener?: string;
}): string => {
  const dim = '\x1b[2m';
  const reset = '\x1b[0m';

  // build output lines
  const lines = [
    `🦫 wassup?`,
    '', // blank line between mascot and artifact
    `🌲 feedback.give --against ${input.artifact}`,
    `   ├─ ✓ ${input.feedbackFilename}`,
    `   ├─ ${dim}tip: use --version ++ to create a new version${reset}`,
  ];

  // add opener line or tip based on whether opener was used
  if (input.opener) {
    lines.push(`   └─ opened in ${input.opener}`);
  } else {
    lines.push(
      `   └─ ${dim}tip: use --open nvim to open automatically${reset}`,
    );
  }

  return lines.join('\n');
};
