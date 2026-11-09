// commonmark expands a tab to the next multiple of 4 columns
const TAB_STOP = 4;

/**
 * .what = the rendered width of a line's indent, in columns
 * .why  = a tab is one char in the source but a run of columns on the page; the nest a reader
 *         sees is set by columns, so a tab-indented layer must compare by its rendered width
 */
export const asIndentWidth = (input: { indent: string }): number =>
  [...input.indent].reduce(
    (column, char) =>
      char === '\t' ? column + TAB_STOP - (column % TAB_STOP) : column + 1,
    0,
  );
