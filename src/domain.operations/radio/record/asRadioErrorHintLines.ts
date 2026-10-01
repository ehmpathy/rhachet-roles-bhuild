/**
 * .what = whether a hint line continues the item above it (an inner tree or indent)
 * .why = an inner tree in a hint must nest under its header, never become peers of it
 */
const isHintContinuation = (input: { line: string }): boolean =>
  /^[\s├└│]/.test(input.line);

/**
 * .what = the width of the whitespace at the front of a line
 * .why = the hint body is indented as a block; that shared base is dropped once
 */
const asIndentWidth = (input: { line: string }): number =>
  input.line.length - input.line.trimStart().length;

/**
 * .what = the hint items under an error headline, bullets stripped; an item that
 *         carries an inner tree holds it as extra lines, joined by newline
 * .why = a held push renders each item as its own tree line under `fix:`, and an
 *        item's inner tree must nest beneath it rather than repeat the outer glyph
 */
export const asRadioErrorHintLines = (input: { message: string }): string[] => {
  // the body lines below the headline, blanks dropped
  const body = input.message
    .split('\n')
    .slice(1)
    .filter((line) => line.trim().length > 0);

  // drop the indent the whole body shares, so top-level items start at column 0
  const indentBase = Math.min(...body.map((line) => asIndentWidth({ line })));
  const lines = body.map((line) => line.slice(indentBase).trimEnd());

  // fold each continuation into the item above it
  return lines.reduce<string[]>((items, line) => {
    const itemPrior = items[items.length - 1];
    if (itemPrior !== undefined && isHintContinuation({ line }))
      return [...items.slice(0, -1), `${itemPrior}\n${line}`];
    return [...items, line.replace(/^•\s*/, '')];
  }, []);
};
