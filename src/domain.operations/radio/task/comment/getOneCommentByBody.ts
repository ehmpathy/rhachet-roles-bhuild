import { isCommentBodySame } from './isCommentBodySame';

/**
 * .what = the first comment on a thread whose body is this body, by the exact-body rule (F3)
 * .why = the gh findsert keeps a body already on the thread and cites that comment's url
 */
export const getOneCommentByBody = <T extends { body: string }>(input: {
  comments: T[];
  body: string;
}): T | null =>
  input.comments.find((comment) =>
    isCommentBodySame({ a: comment.body, b: input.body }),
  ) ?? null;
