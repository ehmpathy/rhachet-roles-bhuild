import { ConstraintError } from 'helpful-errors';

/**
 * .what = an issue exid, checked as a github issue number (digits only)
 * .why = an exid comes from a push arg or a record file, and names the issue a send edits;
 *        a value that is not a number can never name one, so it is refused before any call
 */
export const asGhIssueNumber = (input: { exid: string }): string => {
  if (/^[1-9][0-9]*$/.test(input.exid)) return input.exid;
  throw new ConstraintError(
    `exid "${input.exid}" is not a github issue number; a gh.issues exid is the issue's number, e.g. 599`,
  );
};
