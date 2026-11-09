import { types } from 'util';

/**
 * .what = a caught value as an error, with the errno code it carries (null when none)
 * .why  = each i/o step of the depth lane maps a caller-fixable errno to a refusal; the read of
 *         that code is one decision, so it lives in one place. the error comes back narrowed, so
 *         a caller can attach it as the cause of its refusal
 * .note = a thrown value that is not an error is rethrown as is: no code can be read from it,
 *         and it must never be mistaken for a fixable one. isNativeError holds across realms
 *         (a jest sandbox), where `instanceof Error` does not
 */
export const asErrorWithCode = (input: {
  error: unknown;
}): { error: Error; code: string | null } => {
  const { error } = input;
  if (!(error instanceof Error || types.isNativeError(error))) throw error;
  // only a string is an errno name; a numeric or absent code must never pass as one
  const code =
    'code' in error && typeof error.code === 'string' ? error.code : null;
  return { error, code };
};
