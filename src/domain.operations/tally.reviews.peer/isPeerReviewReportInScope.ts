/**
 * .what = decide whether one file in a route's peer-review dir belongs to the tally's corpus
 * .why  = the corpus is the tally's denominator; its rule must be named, so a reader can
 *         trust what was counted without a decode of a filter chain
 */
export const isPeerReviewReportInScope = (input: {
  file: string;
  lane: string | null;
  laneWout: string[];
}): boolean => {
  // only the parsed report counts; the `.given` wrapper beside it is a render of the run
  if (!input.file.endsWith('.report.md')) return false;

  // --lane-with narrows to the filenames that hold its slug
  if (input.lane !== null && !input.file.includes(input.lane)) return false;

  // --lane-wout drops any filename that holds one of its slugs
  return !input.laneWout.some((wout) => input.file.includes(wout));
};
