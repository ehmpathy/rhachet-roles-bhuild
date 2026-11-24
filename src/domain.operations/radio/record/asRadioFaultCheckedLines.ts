/**
 * .what = the spots an auth miss checked, read from its fault text: one line per spot
 * .why = a drain prints one line of a fault, so a raw stderr never floods the tree; an auth miss
 *        is not raw stderr, and its `checked` spots are the why a human needs (a human email, a
 *        locked key), so a drain row nests them under its fault line
 *
 * .note = reads the `checked` section of the miss tree (getEhmpathAuthMissMessage): the branch
 *         lines after a bare `checked` line, glyphs stripped, up to the first line that is not a
 *         branch. any other fault holds no such section and reads as none
 */
export const asRadioFaultCheckedLines = (input: {
  detail: string | null;
}): string[] => {
  const lines = (input.detail ?? '').split('\n').map((line) => line.trim());
  const indexHeader = lines.indexOf('checked');
  if (indexHeader === -1) return [];
  const linesAfter = lines.slice(indexHeader + 1);
  const indexEnd = linesAfter.findIndex((line) => !/^[├└]─ /.test(line));
  return (indexEnd === -1 ? linesAfter : linesAfter.slice(0, indexEnd)).map(
    (line) => line.slice('├─ '.length),
  );
};
