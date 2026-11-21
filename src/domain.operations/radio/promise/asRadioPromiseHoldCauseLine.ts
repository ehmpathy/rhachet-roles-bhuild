/**
 * .what = the `cause: …` line of a promise hold's detail, or null when it holds none
 * .why = the claim and its cause render on two lines, so no label wraps a cause in parens;
 *        each surface reads the cause here, never by its own split of the detail
 *
 * .note = the detail's shape is set by asRadioPromiseHoldDetail: the claim, then `cause: …`
 */
export const asRadioPromiseHoldCauseLine = (input: {
  detail: string | null;
}): string | null =>
  (input.detail ?? '').split('\n').find((line) => line.startsWith('cause: ')) ??
  null;
