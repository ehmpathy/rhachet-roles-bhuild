import { isCommentBodySame } from './isCommentBodySame';

/**
 * .what = is this body already among the bodies a thread holds, by the exact-body rule (F3)
 * .why = the os.fileops findsert asks "is it already there?" before it appends
 */
export const isCommentBodyAmong = (input: {
  bodies: string[];
  body: string;
}): boolean =>
  input.bodies.some((extant) =>
    isCommentBodySame({ a: extant, b: input.body }),
  );
