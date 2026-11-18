/**
 * .what = the count of held records that await an anonymized promise, with their one move
 * .why = a push or a drain never sends such a record, so each render that says "the rest is
 *        delivered" counts them apart in the same words: the held list footer and the push's
 *        own `next` line
 */
export const asRadioAwaitPromiseCountLine = (input: {
  count: number;
}): string =>
  `${input.count} ${input.count === 1 ? 'awaits' : 'await'} an anonymized promise: \`drain --promise\``;
