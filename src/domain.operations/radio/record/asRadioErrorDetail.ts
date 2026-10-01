/**
 * .what = an error message, without the metadata json helpful-errors appends, plus the
 *         hint that json carried when the message body does not already say it
 * .why = a held record shows the message and its hint lines to a human; the metadata
 *        block is for logs and reads as noise in the tree, but its hint is the fix,
 *        so the hint is kept as one more hint line rather than dropped with the block
 */
export const asRadioErrorDetail = (input: {
  message: string;
  hint: string | null;
}): string => {
  const body =
    input.message.split(/\n\s*\n\s*\{/)[0]?.trimEnd() ?? input.message;
  if (!input.hint || body.includes(input.hint)) return body;
  return `${body}\n  • hint: ${input.hint}`;
};
