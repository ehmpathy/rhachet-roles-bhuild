/**
 * .what = the form of a comment body that "the same comment" is judged by: line ends as `\n`,
 *         edges trimmed
 * .why = github may store a posted body with its trailed newline or a `\r\n` cut; a body piped
 *        via @stdin often ends in one. the record key and the thread match both read this form,
 *        so a repeat lands on its extant record and is never posted twice
 */
export const asCommentBodyCompared = (input: { body: string }): string =>
  input.body.replace(/\r\n/g, '\n').trim();
