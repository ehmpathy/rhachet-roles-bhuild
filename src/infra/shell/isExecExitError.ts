/**
 * .what = did this exec rejection come from a process that ran and exited non-zero
 * .why = only an exit is an answer from the command; a kill at its bound or a spawn fault
 *        is no answer, so a caller must not read it as one
 *
 * .note = an exec rejection is a cross-realm Error (as asExecErrorMessage), so its fields are
 *         read via `in` narrows, never `instanceof` or a cast
 */
export const isExecExitError = (input: { error: unknown }): boolean => {
  // a non-object rejection carries no exit code
  const fault = input.error;
  if (typeof fault !== 'object' || fault === null) return false;

  // an exit carries a numeric code; a kill at its bound carries `killed: true`
  const code = 'code' in fault ? fault.code : null;
  const killed = 'killed' in fault ? fault.killed : null;
  return typeof code === 'number' && killed !== true;
};
