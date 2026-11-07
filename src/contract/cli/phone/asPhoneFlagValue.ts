/**
 * .what = the text a value flag carries, or undefined when it carries none
 * .why = a bare value flag (`--to --what hi`, or an empty `"$ADDR"` in a booter command) parses
 *        as a boolean; read it as absent, so the verb refuses it as a caller fix (exit 2) with the
 *        usage, never as a schema malfunction (exit 1)
 */
export const asPhoneFlagValue = (
  value: string | boolean | undefined,
): string | undefined => (typeof value === 'string' ? value : undefined);
