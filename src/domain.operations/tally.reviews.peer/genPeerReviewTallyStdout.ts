/**
 * .what = render a peer-review tally as a treestruct, per rule.require.treestruct-output
 * .why  = a reader parses the tally at a glance, and sees the CORPUS beside the counts:
 *         a percentage with no denominator on the page reads as a clean number
 */

import { asNounForCount } from './asNounForCount';
import type { PeerReviewTally } from './computePeerReviewTally';
import { getColumnWidth } from './getColumnWidth';

/**
 * .what = the tree a caller sees
 * .why  = one render for both groupings; by lane adds the report count per row
 */
export const genPeerReviewTallyStdout = (input: {
  tally: PeerReviewTally;
}): string => {
  const { tally } = input;
  const keyWidth = getColumnWidth({
    values: tally.rows.map((row) => row.key),
    min: 4,
  });

  const rowLines = tally.rows.map((row, index) =>
    asTallyRowLine({
      row,
      tally,
      keyWidth,
      isLast: index === tally.rows.length - 1,
    }),
  );

  // the same banner the help and init.behavior open with, so one command reads one grammar
  return [
    '🦫 oh, behave!',
    '',
    '🌲 tally.reviews.peer',
    `   ├─ route: ${tally.corpus.route}`,
    `   ├─ lane-with: ${tally.corpus.lane ?? '(all lanes)'}`,
    ...(tally.corpus.laneWout.length
      ? [`   ├─ lane-wout: ${tally.corpus.laneWout.join(' · ')}`]
      : []),
    `   ├─ corpus: ${asCount({ count: tally.corpus.reports, noun: 'report' })}`,
    `   ├─ totals: ${asCount({ count: tally.totals.points, noun: 'point' })} · ${asCount({ count: tally.totals.blockers, noun: 'blocker' })} · ${asCount({ count: tally.totals.nitpicks, noun: 'nitpick' })}`,
    `   └─ by ${tally.by}`,
    ...(rowLines.length
      ? rowLines
      : [`      └─ (none — the corpus cites no ${tally.by})`]),
  ].join('\n');
};

/**
 * .what = one row of the tally tree: its points, its share, its key, and its counts
 * .why  = by lane adds the report count, since a lane with many reports and no blocker is the signal
 */
const asTallyRowLine = (input: {
  row: PeerReviewTally['rows'][number];
  tally: PeerReviewTally;
  keyWidth: number;
  isLast: boolean;
}): string => {
  const { row, tally } = input;
  const counts =
    tally.by === 'lane'
      ? // the noun pads to its plural width, so a singular row keeps the `b=` column aligned
        `${String(row.reports).padStart(3)} ${asNounForCount({ count: row.reports, noun: 'report' }).padEnd(7)} · b=${row.blockers} n=${row.nitpicks}`
      : `b=${row.blockers} n=${row.nitpicks}`;
  const share = asSharePercent({
    points: row.points,
    total: tally.totals.points,
  });
  // the lead count names its noun, so it never reads as the report count beside it
  const points = `${String(row.points).padStart(4)} ${asNounForCount({ count: row.points, noun: 'point' }).padEnd(6)}`;
  return `      ${input.isLast ? '└─' : '├─'} ${points}  ${share}  ${row.key.padEnd(input.keyWidth)}  ${counts}`;
};

/**
 * .what = a count with its noun, singular for one
 */
const asCount = (input: { count: number; noun: string }): string =>
  `${input.count} ${asNounForCount(input)}`;

/**
 * .what = a row's share of all points, as a fixed-width percent; a dash when no points exist
 * .why  = a 0/0 share is undefined, so a dash says "no points" where `NaN%` would mislead
 */
const asSharePercent = (input: { points: number; total: number }): string =>
  input.total === 0
    ? '   — '
    : `${((100 * input.points) / input.total).toFixed(1).padStart(5)}%`;
