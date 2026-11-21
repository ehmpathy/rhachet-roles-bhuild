/**
 * .what = the `code` a system error carries, or null
 * .why = a system error may come from another realm, where `instanceof Error` reads false; the
 *        code is read off any object instead
 */
export const asErrorCode = (input: { error: unknown }): string | null =>
  typeof input.error === 'object' &&
  input.error !== null &&
  'code' in input.error &&
  typeof input.error.code === 'string'
    ? input.error.code
    : null;
