/**
 * .what = the one line a text record keeps as the reason a delivery faulted
 * .why = a phone refusal's message is a headline plus a tree of fixes, and helpful-errors leads a
 *        message with its glyph and class; a record's reason holds only the bare headline, so
 *        `phone.text get` reads one plain line per text
 */
export const asPhoneReasonOfError = (input: { error: Error }): string => {
  const headline = input.error.message.split('\n')[0]?.trim() ?? '';
  const bare = headline.replace(/^\S+ (Constraint|Malfunction)Error: /, '');
  return bare || input.error.name;
};
