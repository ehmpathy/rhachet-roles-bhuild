import { MalfunctionError } from 'helpful-errors';

/**
 * .what = the comments of one thread, read off `gh issue view --json number,comments`
 * .why = the dao needs each comment's body (to find a repeat) and url (to cite it); the parse and
 *        the shape check live here so the dao reads as narrative
 *
 * .note = a payload that is not that shape means gh changed its output; it fails loud as a
 *         malfunction, never read as "no comments", which would post the body twice
 */
export const asCommentsFromGhIssueJson = (input: {
  json: string;
}): { body: string; url: string }[] => {
  // parse gh's payload; a syntax fault is a gh output change, named
  const payload = asJsonOrNull({ json: input.json });
  const comments =
    typeof payload === 'object' && payload !== null && 'comments' in payload
      ? payload.comments
      : null;
  if (!Array.isArray(comments))
    throw new MalfunctionError(
      'gh issue view returned no comments list; the gh cli output shape may have changed',
      { json: input.json.slice(0, 500) },
    );

  // keep the two fields a comment needs, each a string
  return comments.map((comment: unknown) => {
    const found = asCommentBodyAndUrlOrNull({ comment });
    if (found === null)
      throw new MalfunctionError(
        'gh issue view returned a comment with no body or url; the gh cli output shape may have changed',
        { comment },
      );
    return found;
  });
};

/**
 * .what = the body and url of one gh comment, or null when either is not text
 */
const asCommentBodyAndUrlOrNull = (input: {
  comment: unknown;
}): { body: string; url: string } | null => {
  const { comment } = input;
  if (typeof comment !== 'object' || comment === null) return null;
  if (!('body' in comment) || !('url' in comment)) return null;
  if (typeof comment.body !== 'string' || typeof comment.url !== 'string')
    return null;
  return { body: comment.body, url: comment.url };
};

/**
 * .what = the parsed json, or null when it is not json
 */
const asJsonOrNull = (input: { json: string }): unknown => {
  try {
    return JSON.parse(input.json);
  } catch (error) {
    // only a json syntax fault means "not json"; any other throw is a defect
    if (error instanceof SyntaxError) return null;
    throw error;
  }
};
