/**
 * .what = an error line with its class header (`✋ ConstraintError: `) cut from its head
 * .why = a held record's reason rows (`fault:`, `fix it:`) read the fault's own words;
 *        the class header is the error's own banner, and two shapes for one row read as drift
 */
export const asRadioErrorTextSansClass = (input: { line: string }): string =>
  input.line.replace(/^(?:✋|💥)?\s*[A-Za-z]*Error:\s+/u, '');
