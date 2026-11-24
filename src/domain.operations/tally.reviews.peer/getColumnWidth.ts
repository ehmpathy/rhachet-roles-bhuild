/**
 * .what = the width of a text column: its longest value, at least `min`
 * .why  = the tally rows and the --help option rows both pad a column to its widest
 *         cell; one named transform keeps the two from drift
 */
export const getColumnWidth = (input: {
  values: string[];
  min: number;
}): number => Math.max(...input.values.map((value) => value.length), input.min);
