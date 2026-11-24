/**
 * .what = the noun a count reads with: `report` for one, `reports` for all else
 * .why  = `1 report(s)` hedges a number the tally knows exactly; a true singular
 *         reads the way `1 byte` does elsewhere in this repo's output
 * .note = every noun the tally counts takes a plain `s`
 */
export const asNounForCount = (input: {
  count: number;
  noun: string;
}): string => (input.count === 1 ? input.noun : `${input.noun}s`);
