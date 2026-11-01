import { type BadRequestError, ConstraintError } from 'helpful-errors';

/**
 * .what = the auth fault of a record whose credentials took longer than their cap to derive
 * .why = a shell auth or a keyrack unlock that waits on a vault or a hardware prompt is this
 *        record's own auth fault, not a spent drain budget; it is set aside as `upstream:auth`
 *        so its fix shows, and the line moves on
 */
export const asRadioAuthDeriveStallError = (input: {
  cap: { milliseconds: number };
}): BadRequestError =>
  new ConstraintError(
    `the auth derive did not finish within ${Math.round(input.cap.milliseconds / 1000)}s`,
    {
      capMilliseconds: input.cap.milliseconds,
      hint: 'check the auth runs at once and prints a token (a keyrack may wait on an unlock), or amend the record to another --auth',
    },
  );
