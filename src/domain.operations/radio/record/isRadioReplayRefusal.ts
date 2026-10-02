import { BadRequestError, ConstraintError } from 'helpful-errors';

/**
 * .what = did upstream refuse this send for good (vs a fault a retry may pass)
 * .why = a refusal closes its record; a fault keeps it held for the next push
 *
 * .note = the task ops refuse with a plain BadRequestError (e.g. `task already
 *         claimed by different branch`, `cannot transition from DELIVERED`).
 *         the gh dao reports a rejected token as a ConstraintError, a subclass —
 *         a fixable fault, so it is excluded
 */
export const isRadioReplayRefusal = (input: { error: Error }): boolean =>
  input.error instanceof BadRequestError &&
  !(input.error instanceof ConstraintError);
