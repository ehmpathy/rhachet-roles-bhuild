import { asNounForCount } from './asNounForCount';

/**
 * .what = the fix to print when the tally's corpus selects zero reports
 * .why  = each of the three causes takes a different fix, so one hint that names
 *         all three leaves the caller to guess which one applies
 * .note = `reportsInDir` counts the dir before any filter. a filter cannot be blamed
 *         for an empty dir, so the empty dir is checked first
 */
export const getEmptyCorpusHint = (input: {
  lane: string | null;
  laneWout: string[];
  reportsInDir: number;
}): string => {
  // the dir holds no report at all, whatever the filters
  if (input.reportsInDir === 0)
    return "the dir holds no *.report.md, since no stone's guard has run a peer lane yet. run one, then tally again — rhx route.stone.set --stone <stone> --as arrived";

  // a --lane-with filter that matched no filename
  if (input.lane)
    return `no report filename contains "${input.lane}" — check the lane slug against the filenames in that dir`;

  // a --lane-wout list that dropped every report
  return `--lane-wout ${input.laneWout.join(',')} dropped all ${input.reportsInDir} ${asNounForCount({ count: input.reportsInDir, noun: 'report' })} — narrow the list, or omit it`;
};
