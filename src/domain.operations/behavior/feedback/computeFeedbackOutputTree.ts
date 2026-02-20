import { basename } from 'path';

/**
 * .what = compute tree-style output for give.feedback result
 * .why = vibed, scannable output that shows feedback file status
 */
export const computeFeedbackOutputTree = (input: {
  feedbackPathRel: string;
  found: boolean;
  opener?: string;
  version?: number;
}): string => {
  // ansi codes for dimmed text
  const dim = '\x1b[2m';
  const reset = '\x1b[0m';

  // define symbols
  const symbolCreated = '+';
  const symbolFound = '✓';

  // choose symbol based on found status
  const symbol = input.found ? symbolFound : symbolCreated;

  // build header
  const header = '🦫 wassup?';

  // collect all lines
  const lines: string[] = [];

  // first line: just filename (full path shown in repl prior feedback section)
  const filename = basename(input.feedbackPathRel);
  lines.push(`   ├─ ${symbol} ${filename}`);

  // add version tip if file was found (dimmed)
  if (input.found) {
    const nextVersion = (input.version ?? 1) + 1;
    lines.push(
      `   ├─ ${dim}tip: use --version ${nextVersion} to create a new version${reset}`,
    );
  }

  // add opener line or tip
  if (input.opener) {
    lines.push(`   ├─ opened in ${input.opener}`);
  } else {
    lines.push(
      `   ├─ ${dim}tip: use --open codium to open automatically${reset}`,
    );
  }

  // add repl tip as last line
  lines.push(`   └─ ${dim}tip: use --talk for interactive repl mode${reset}`);

  return [header, ...lines].join('\n');
};
