/**
 * .what = compute tree-style output for behavior init file actions
 * .why = vibed, scannable output that shows file actions clearly
 * .note = a kept file that drifted from its template carries an inline mark on its
 *         row, and the stale outputs below name what drifted and how to adopt it
 */
export const computeOutputTree = (input: {
  created: string[];
  kept: string[];
  updated: string[];
  drifted: string[];
}): string => {
  // define symbols for each action type
  const symbolCreated = '+';
  const symbolKept = '✓';
  const symbolUpdated = '↻';

  // combine all files with their symbols
  const entries: Array<{ file: string; symbol: string }> = [
    ...input.created.map((file) => ({ file, symbol: symbolCreated })),
    ...input.kept.map((file) => ({ file, symbol: symbolKept })),
    ...input.updated.map((file) => ({ file, symbol: symbolUpdated })),
  ];

  // sort alphabetically by filename
  entries.sort((a, b) => a.file.localeCompare(b.file));

  // build header
  const header = '🦫 oh, behave!';

  // handle empty case
  if (entries.length === 0) return header;

  // build tree lines; a drifted kept row says so after its name, so the symbol column holds
  const lines = entries.map((entry, index) => {
    const isLast = index === entries.length - 1;
    const branch = isLast ? '└─' : '├─';
    const mark = input.drifted.includes(entry.file)
      ? '  ← drifted from its template, see below'
      : '';
    return `   ${branch} ${entry.symbol} ${entry.file}${mark}`;
  });

  return [header, ...lines].join('\n');
};
