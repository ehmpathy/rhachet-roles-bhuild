/**
 * .what = the first line of an error message
 * .why = the headline is what a human reads in a one-line reason; the hint lines and the
 *        metadata json helpful-errors appends follow it
 */
export const asRadioErrorHeadline = (input: { message: string }): string =>
  input.message.split('\n')[0] ?? input.message;
