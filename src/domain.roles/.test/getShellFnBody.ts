/**
 * .what = reads one top-level shell function out of a text — its header line
 *         through the `}` that closes it at column 0
 *
 * .why  = a clamp that ends a body at "the next function" or "the next banner"
 *         leans on what sits BELOW the function, which is a property of the file
 *         layout, never of the function. a lib cut into parts moves a function
 *         to the end of its file, and every such slicer then runs off the end.
 *
 *         ⇒ the close at column 0 is a property of the function itself: every
 *           top-level function in these libs closes with a bare `}` line, and no
 *           nested block does, since nested blocks are indented.
 *
 * .note = returns '' when the function is absent, so a caller's anti-vacuity
 *         tooth (a length floor) names the rename rather than a false match.
 */
export const getShellFnBody = (input: { text: string; fn: string }): string => {
  const lines = input.text.split('\n');
  const from = lines.findIndex((line) => line.startsWith(`${input.fn}() {`));
  if (from < 0) return '';
  const till = lines.findIndex((line, at) => at > from && line === '}');
  if (till < 0) return '';
  return lines.slice(from, till + 1).join('\n');
};
