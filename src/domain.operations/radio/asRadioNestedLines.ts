/**
 * .what = a tree child that carries its own sub-branches, as one newline-joined string
 * .why = asRadioTreeLines renders a child's extra lines on the child's rail, so a held
 *        record's fix lines nest under it rather than beside it
 *
 * .note = shared by radio/record (held rows) and radio/auth (the as-ehmpath miss), so it
 *         sits at their common ancestor
 * .note = a line may carry its own sub-branches (a newline-joined string); its later lines sit
 *         on that line's rail, so a tree nests to any depth and never breaks its rails
 */
export const asRadioNestedLines = (input: {
  head: string;
  lines: string[];
}): string =>
  [
    input.head,
    ...input.lines.flatMap((line, index) => {
      const isLast = index === input.lines.length - 1;
      const [lineFirst, ...linesRest] = line.split('\n');
      return [
        `${isLast ? '└─' : '├─'} ${lineFirst}`,
        ...linesRest.map((lineRest) => `${isLast ? '   ' : '│  '}${lineRest}`),
      ];
    }),
  ].join('\n');
