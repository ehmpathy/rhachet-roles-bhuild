import { MalfunctionError } from 'helpful-errors';

/**
 * .what = the bodies an os.fileops comment log holds, one json entry per line
 * .why = a json line keeps a body with newlines or delimiters literal, so the exact-body check
 *        never misreads an entry
 *
 * .note = a line that is not `{"body": "<text>"}` (a torn append, a hand edit) fails loud with
 *         the log path, the line number, and the repair; it is never skipped, since a skipped
 *         entry would let its body post twice
 */
export const asCommentBodiesFromLog = (input: {
  text: string;
  path: string;
}): string[] =>
  input.text.split('\n').flatMap((line, index) => {
    // a blank line holds no entry
    if (line.trim() === '') return [];

    // each other line must be one entry with a string body
    const body = asCommentBodyFromLogLine({ line });
    if (body === null)
      throw new MalfunctionError(
        `comment log ${input.path} line ${index + 1} is not a comment entry; repair or remove that line, then run again`,
        { path: input.path, line: index + 1, text: line.slice(0, 200) },
      );
    return [body];
  });

/**
 * .what = the body of one log line, or null when the line is not a comment entry
 * .why = the parse and the shape check sit apart from the fault, so the caller names the line
 */
const asCommentBodyFromLogLine = (input: { line: string }): string | null => {
  try {
    const entry: unknown = JSON.parse(input.line);
    if (typeof entry !== 'object' || entry === null) return null;
    if (!('body' in entry)) return null;
    return typeof entry.body === 'string' ? entry.body : null;
  } catch (error) {
    // only a json syntax fault means "not an entry"; any other throw is a defect
    if (error instanceof SyntaxError) return null;
    throw error;
  }
};
