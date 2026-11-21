/**
 * .what = the backlog line of a push render
 * .why = the count is the nudge; zero says the pond is clear. one source, so the push output
 *        and the promise nudge never word the same count two ways
 */
export const asRadioBacklogBranch = (input: {
  backlog: number;
}): { line: string; children: string[] } => ({
  line:
    input.backlog === 0
      ? 'backlog = 0'
      : `backlog = ${input.backlog} ${input.backlog === 1 ? 'awaits' : 'await'} the radio`,
  children: [],
});
