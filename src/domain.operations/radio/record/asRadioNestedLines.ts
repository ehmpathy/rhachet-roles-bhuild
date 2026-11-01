/**
 * .what = a tree child that carries its own sub-branches, as one newline-joined string
 * .why = asRadioTreeLines renders a child's extra lines on the child's rail, so a held
 *        record's fix lines nest under it rather than beside it
 */
export const asRadioNestedLines = (input: {
  head: string;
  lines: string[];
}): string =>
  [
    input.head,
    ...input.lines.map(
      (line, index) =>
        `${index === input.lines.length - 1 ? '└─' : '├─'} ${line}`,
    ),
  ].join('\n');
