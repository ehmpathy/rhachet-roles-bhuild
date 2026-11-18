/**
 * .what = the new comment's url, read off `gh issue comment` stdout; null when none is there
 * .why = gh prints the url as its last line. the buffer is trimmed first, so a trailed newline
 *        or blank line never hides the url, whatever the transport strips
 */
export const asCommentUrlFromGhOutput = (input: {
  output: string;
}): string | null => {
  const lineLast = input.output.trim().split('\n').pop()?.trim() ?? '';
  return lineLast.includes('#issuecomment-') ? lineLast : null;
};
