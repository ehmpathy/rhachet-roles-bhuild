import type { ConstraintError } from 'helpful-errors';

import { asKeyrackRobotTokenFix } from './asKeyrackRobotTokenFix';

/**
 * .what = the keyrack miss row, fix, and cause, read off a keyrack ConstraintError
 * .why = the keyrack refusal carries its status and any auto-unlock cause in metadata;
 *        this turns that metadata into the miss the as-ehmpath tree renders
 *
 * .note = the absent refusal carries no status in its metadata, so an error with none
 *         reads as absent
 */
export const asEhmpathKeyrackMiss = (input: {
  error: ConstraintError;
  coordinate: { owner: string; env: string; key: string };
}): { row: string; fix: string | null; cause: string | null } => {
  const statusFound: unknown = input.error.metadata?.status;
  const status = typeof statusFound === 'string' ? statusFound : 'absent';
  const causeFound: unknown = input.error.metadata?.unlockFailure;
  return {
    row: `keyrack: not granted (status: ${status})`,
    fix: asKeyrackRobotTokenFix({ ...input.coordinate, status }),
    cause: typeof causeFound === 'string' ? causeFound : null,
  };
};
