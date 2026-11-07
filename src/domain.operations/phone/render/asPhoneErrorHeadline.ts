/**
 * .what = the one line of an error a thread may hold as a reason: its message, sans class and context
 * .why = a helpful error's message carries its class header and a json block of its context; a
 *        reason sits on one row of a thread, so it keeps the claim alone, and the full error is
 *        logged where a human debugs it
 */
export const asPhoneErrorHeadline = (input: { error: Error }): string => {
  const lineFirst = input.error.message.trim().split('\n')[0] ?? '';
  const headline = lineFirst
    .replace(
      /^\S*\s*(ConstraintError|MalfunctionError|BadRequestError|UnexpectedCodePathError):\s*/,
      '',
    )
    .trim();
  return headline || input.error.name;
};
