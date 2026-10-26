/**
 * .what = the printable text of an error's hint, whatever shape it holds
 * .why  = a hint may be a string, a list of steps, or an object; a hint the
 *         cli drops is a fix the human never sees, so every shape prints
 */
export const asCliHintText = (input: { hint: unknown }): string | null => {
  // absent hint: naught to print
  if (input.hint === undefined || input.hint === null) return null;

  // a string prints as-is; an empty one is absent
  if (typeof input.hint === 'string')
    return input.hint.length ? input.hint : null;

  // a list of steps prints one per line
  if (Array.isArray(input.hint)) {
    const lines = input.hint.map((step) =>
      typeof step === 'string' ? step : JSON.stringify(step),
    );
    return lines.length ? lines.join('\n') : null;
  }

  // any other shape prints as json, so its content is never lost
  return JSON.stringify(input.hint);
};
