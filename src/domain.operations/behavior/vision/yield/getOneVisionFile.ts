import { readFileSync } from 'fs';
import { ConstraintError } from 'helpful-errors';

import { asErrorWithCode } from './asErrorWithCode';
import { asRefusalOfReadCode } from './asRefusalOfReadCode';

/**
 * .what = reads a vision yield's text from disk
 * .why  = the one i/o boundary of the depth lane. one read attempt, never a check-then-read,
 *         so a path that changes mid-call still gets one answer: a read error the caller can
 *         fix (absent, a dir, no read permission) is a constraint; all else is rethrown as is
 * .note = pathRel names the file in each refusal, as the guard names it
 */
export const getOneVisionFile = (input: {
  pathAbs: string;
  pathRel: string;
}): { markdown: string } => {
  try {
    return { markdown: readFileSync(input.pathAbs, 'utf8') };
  } catch (thrown) {
    // allowlist: only a read error the caller can fix becomes a constraint
    const { error, code } = asErrorWithCode({ error: thrown });
    const refusal = asRefusalOfReadCode({ code, pathRel: input.pathRel });
    if (!refusal) throw error;
    throw new ConstraintError(refusal.message, {
      vision: input.pathRel,
      // `errno`, never `code`: helpful-errors reserves `code` for its exit code, and drops it
      // from the message a human reads
      errno: code,
      hint: refusal.hint,
      cause: error,
    });
  }
};
