/**
 * .what = a tree child that carries its own sub-branches, as one newline-joined string
 * .why = asRadioTreeLines renders a child's extra lines on the child's rail, so a held
 *        record's fix lines nest under it rather than beside it
 *
 * .note = shared by radio/record (held rows) and radio/auth (the as-ehmpath miss), so it
 *         sits at their common ancestor
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
