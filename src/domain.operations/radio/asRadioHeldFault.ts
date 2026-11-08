import { BadRequestError } from 'helpful-errors';

/**
 * .what = a caught error as the fault that holds a record, if it is a caller-fix one; else rethrow
 * .why = an auth read that fails on the caller's side holds the one record, named; any other
 *        fault is a malfunction and must not be swallowed into a hold
 *
 * .note = use as a `.catch(asRadioHeldFault)` handler
 */
export const asRadioHeldFault = (
  error: unknown,
): { fault: BadRequestError } => {
  if (!(error instanceof BadRequestError)) throw error;
  return { fault: error };
};
