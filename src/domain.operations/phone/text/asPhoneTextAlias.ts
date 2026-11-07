/**
 * .what = the 8-char alias a text is shown by
 */
export const asPhoneTextAlias = (input: { uuid: string }): string =>
  input.uuid.slice(0, 8);
