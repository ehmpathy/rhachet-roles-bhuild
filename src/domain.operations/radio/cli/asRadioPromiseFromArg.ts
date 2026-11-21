import { ConstraintError } from 'helpful-errors';

import { RADIO_PROMISE_PUBLIC_REPO } from '../promise/RADIO_PROMISE_PUBLIC_REPO';

/**
 * .what = the promise a `--promise` flag carries, or null when the flag is absent
 * .why = the promise names a claim the sender makes, so only its exact words count; any
 *        other value, or a bare flag, is refused before any record or request, with the one
 *        valid value named so the fix is a copy away
 *
 * .note = raw is the parsed flag: a string value, `true` for a bare `--promise`, or null
 */
export const asRadioPromiseFromArg = (input: {
  raw: string | boolean | null;
}): string | null => {
  // absent: no promise
  if (input.raw === null || input.raw === false) return null;

  // the exact literal: the promise
  if (input.raw === RADIO_PROMISE_PUBLIC_REPO) return input.raw;

  // any other value, or a bare flag: refuse, with the valid value named
  const shown = input.raw === true ? '(no value)' : `'${input.raw}'`;
  throw new ConstraintError(
    `--promise ${shown} is not a promise this radio knows; the one valid value: --promise ${RADIO_PROMISE_PUBLIC_REPO}`,
  );
};
