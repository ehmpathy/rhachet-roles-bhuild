import type { RadioPromiseHoldReason } from './RadioPromiseHoldReason';

/**
 * .what = a read's cause, with its error class header cut off
 * .why = the cause sits on a line under the claim that already says what failed; a nested
 *        `✋ ConstraintError:` there reads as a second error
 */
const asCauseWithoutHeader = (input: { cause: string }): string =>
  input.cause.replace(/^(✋|💥)\s+\w+Error:\s*/u, '');

/**
 * .what = the claim of a promise hold, from its reason code alone
 * .why = one short line every surface can wrap in its own label, with no cause inside it
 */
const asClaim = (input: { reason: RadioPromiseHoldReason }): string => {
  switch (input.reason) {
    case 'public-repo:unpromised':
      return 'public repo, no anonymized promise on this record';
    case 'public-repo:unreadable':
      return 'visibility unreadable — treated as public';
    case 'public-repo:unreadable-auth':
      return 'visibility unreadable on this auth — try as-human';
  }
};

/**
 * .what = the human why of a promise hold, from its reason code and the read's cause
 * .why = the record stores only the machine code; every surface derives its readable lines
 *        here, so a held row, a dropped record, and a drain row say the same words
 *
 * .note = line 1 is the claim; a cause, when known, is line 2, `cause: <the read's text>`.
 *         the cause never sits in parens on the claim's line: gh's own text carries parens
 *         (`(401)`), and a label that wraps the claim adds a third pair
 * .note = cause is the failed read's own text (null: the read succeeded, or the record was
 *         re-read from disk with no cause kept); a null cause yields the claim alone
 */
export const asRadioPromiseHoldDetail = (input: {
  reason: RadioPromiseHoldReason;
  cause: string | null;
}): string => {
  const claim = asClaim({ reason: input.reason });
  if (!input.cause) return claim;
  return `${claim}\ncause: ${asCauseWithoutHeader({ cause: input.cause })}`;
};
