import { BadRequestError, MalfunctionError } from 'helpful-errors';

import { asExecErrorMessage } from '@src/infra/shell/asExecErrorMessage';

/**
 * .what = the send fault this thrown value is, or null when it is a defect
 * .why = a send fault holds its record for the next push; a defect must fail loud,
 *        never be downgraded to a held record (failhide)
 *
 * .note = the allowlist, and naught else:
 *         - a BadRequestError (or its ConstraintError subclass) the radio ops throw
 *           on purpose: an absent or rejected token, a refusal
 *         - a child_process exec error (a string `cmd`) from the channel's send
 *         - an fs error (a string `code`, `syscall`, and `path`) from the channel's io
 *         an UnexpectedCodePathError, MalfunctionError, TypeError, or any other value
 *         is a defect. the io errors are cross-realm under jest, so they are
 *         duck-typed on the fields node sets, and returned as a MalfunctionError
 *         that keeps their message and names the io kind
 */
export const asRadioUpstreamFault = (input: {
  error: unknown;
}): Error | null => {
  // a deliberate refusal or auth fault from the radio ops
  if (input.error instanceof BadRequestError) return input.error;

  // an io fault from the channel's send, duck-typed across realms
  const io = asRadioIoFaultKind({ error: input.error });
  if (!io) return null;
  return new MalfunctionError(asExecErrorMessage({ error: input.error }), {
    io,
  });
};

/**
 * .what = which io fault this value is: 'exec', 'fs', or null
 * .why = only the shapes node sets on a failed child_process or fs call count
 */
const asRadioIoFaultKind = (input: {
  error: unknown;
}): 'exec' | 'fs' | null => {
  if (typeof input.error !== 'object' || input.error === null) return null;
  const fields = input.error as Record<string, unknown>; // duck-type: cross-realm node error
  if (typeof fields.cmd === 'string') return 'exec';
  const isFs =
    typeof fields.code === 'string' &&
    typeof fields.syscall === 'string' &&
    typeof fields.path === 'string';
  if (isFs) return 'fs';
  return null;
};
