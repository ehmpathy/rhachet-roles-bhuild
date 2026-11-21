import { asCommentBodyCompared } from './asCommentBodyCompared';

/**
 * .what = do two comment bodies match, by the exact-body rule (F3)
 * .why = the one test every comment dao uses before it posts, so "the same comment" holds one
 *        sense on every channel
 */
export const isCommentBodySame = (input: { a: string; b: string }): boolean =>
  asCommentBodyCompared({ body: input.a }) ===
  asCommentBodyCompared({ body: input.b });
