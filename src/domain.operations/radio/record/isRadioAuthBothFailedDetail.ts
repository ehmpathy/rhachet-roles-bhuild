/**
 * .what = does this fault detail carry the both-failed tree, one fix per credential
 * .why = where that tree renders, the static credential fix lines would say each fix twice
 *
 * .note = matches the bullets asRadioAuthBothFailedError writes beneath its headline
 */
export const isRadioAuthBothFailedDetail = (input: {
  detail: string | null;
}): boolean =>
  !!input.detail &&
  input.detail.includes('• the ehmpath bot token:') &&
  input.detail.includes('• the ambient credential:');
