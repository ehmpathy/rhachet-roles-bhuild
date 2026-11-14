/**
 * .what = the text a failed gh call carries: its message and its stderr
 * .why = an exec rejection holds gh's stderr apart from the message; the fault checks read both
 */
export const asGhFaultText = (input: { error: unknown }): string => {
  const message =
    input.error instanceof Error ? input.error.message : String(input.error);
  const stderr = asGhFaultStderr({ error: input.error });
  return `${message} ${stderr}`.trim();
};

/**
 * .what = the stderr field an exec rejection carries, or '' when there is none
 */
const asGhFaultStderr = (input: { error: unknown }): string => {
  if (typeof input.error !== 'object' || input.error === null) return '';
  if (!('stderr' in input.error)) return '';
  return typeof input.error.stderr === 'string' ? input.error.stderr : '';
};
