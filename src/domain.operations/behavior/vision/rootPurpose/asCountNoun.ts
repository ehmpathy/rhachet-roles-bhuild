/**
 * .what = the word for a count: `1 layer`, `2 layers`
 * .why  = every count the verdict states reads as a human would say it
 */
export const asCountNoun = (input: {
  count: number;
  singular: string;
  plural: string;
}): string =>
  `${input.count} ${input.count === 1 ? input.singular : input.plural}`;
