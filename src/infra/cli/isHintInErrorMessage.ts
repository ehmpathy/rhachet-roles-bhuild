/**
 * .what = does an error message already carry its hint
 * .why = helpful-errors embeds metadata (the hint among it) into error.message as
 *        json, where a newline reads as `\n`. a raw includes() misses a multi-line
 *        hint, so the cli printed it twice
 */
export const isHintInErrorMessage = (input: {
  message: string;
  hint: string;
}): boolean => {
  const hintEscaped = JSON.stringify(input.hint).slice(1, -1);
  return (
    input.message.includes(input.hint) || input.message.includes(hintEscaped)
  );
};
