/**
 * .what = the numeric exit code of a shell exec rejection, or null when it has none
 * .why = a command that ran and exited non-zero (a git key unset, a gh with no login) is
 *        an answer; a rejection with no exit code (a kill, a timeout, a spawn fault) is a
 *        fault. callers branch on this to tell the two apart
 *
 * .note = the exec rejection is a cross-realm Error, so it is read duck-typed, never via
 *         `instanceof`
 */
export const asExecExitCode = (input: { error: unknown }): number | null => {
  const { error } = input;
  if (typeof error !== 'object' || error === null) return null;
  if (!('code' in error)) return null;
  return typeof error.code === 'number' ? error.code : null;
};
