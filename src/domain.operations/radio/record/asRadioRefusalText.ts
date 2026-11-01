/**
 * .what = an upstream refusal as a human reads it: the first line, its error class prefix cut
 * .why = a refusal is a settled fact about the task (not a radio task, task not found), not a
 *        fault of this tool; a raw `BadRequestError:` prefix reads as an internal crash
 */
export const asRadioRefusalText = (input: { detail: string }): string => {
  const headline = input.detail.split('\n')[0] ?? input.detail;
  return headline.replace(/^[A-Za-z]*Error: /, '');
};
