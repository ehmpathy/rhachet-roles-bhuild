/**
 * .what = render a peer-review tally as a treestruct, per rule.require.treestruct-output
 * .why  = a reader must parse the tally at a glance, and must see the CORPUS beside the
 *         counts — a percentage with no denominator on the page is the exact shape that
 *         let a stale "54% of 56" survive three re-reads
 */

import type { PeerReviewTally } from './getPeerReviewTally';

/**
 * .what = the tree a caller sees
 */
export const genPeerReviewTallyStdout = (input: {
  tally: PeerReviewTally;
}): string => {
  const { tally } = input;
  const share = (n: number): string =>
    tally.totals.points === 0
      ? '   — '
      : `${((100 * n) / tally.totals.points).toFixed(1).padStart(5)}%`;

  const keyWidth = Math.max(...tally.rows.map((row) => row.key.length), 4);

  const rowLines = tally.rows.map((row, index) => {
    const last = index === tally.rows.length - 1;
    const counts =
      tally.by === 'lane'
        ? `${String(row.reports).padStart(3)} reports · b=${row.blockers} n=${row.nitpicks}`
        : `b=${row.blockers} n=${row.nitpicks}`;
    return `      ${last ? '└─' : '├─'} ${String(row.points).padStart(4)}  ${share(
      row.points,
    )}  ${row.key.padEnd(keyWidth)}  ${counts}`;
  });

  return [
    '🌲 tally.reviews.peer',
    `   ├─ route: ${tally.corpus.route}`,
    `   ├─ lane: ${tally.corpus.lane ?? '@all'}`,
    ...(tally.corpus.laneWout.length
      ? [`   ├─ lane-wout: ${tally.corpus.laneWout.join(' · ')}`]
      : []),
    `   ├─ corpus: ${tally.corpus.reports} report(s)`,
    `   ├─ totals: ${tally.totals.points} point(s) · ${tally.totals.blockers} blocker(s) · ${tally.totals.nitpicks} nitpick(s)`,
    `   └─ by ${tally.by}`,
    ...rowLines,
  ].join('\n');
};
