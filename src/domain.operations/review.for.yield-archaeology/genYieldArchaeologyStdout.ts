/**
 * .what = render the archaeology lint's verdict in the shape `contract.reviewer-output` demands
 * .why  = the guard parses stdout for a numeric count on BOTH dimensions. a review it cannot
 *         read is a `malfunction`, so the two lines are emitted on every path, the clean one too.
 */

import type { ArchaeologyPoint } from './getAllArchaeologyMarkers';

/**
 * .what = the reviewer-contract stdout for one lint run
 * .note = one point per located tell, graded by its marker. every point names a FILE and a
 *         LINE, so the repair is an edit rather than an argument.
 */
export const genYieldArchaeologyStdout = (input: {
  points: ArchaeologyPoint[];
  paths: string[];
}): string => {
  const blockers = input.points.filter((point) => point.grade === 'blocker');
  const nitpicks = input.points.filter((point) => point.grade === 'nitpick');

  const rows = input.points.map((point) => {
    const mark = point.grade === 'blocker' ? '🔴' : '🟡';
    return [
      `   ├─ ${mark} ${point.path}:${point.line} · ${point.slug}`,
      `   │     ${point.what}`,
      `   │     > ${asClipped({ text: point.text })}`,
    ].join('\n');
  });

  return [
    input.points.length === 0
      ? '🌲 yield-archaeology — no archaeology found in the yield'
      : '🌲 yield-archaeology — the yield states its own road',
    `   ├─ read: ${input.paths.length} yield${input.paths.length === 1 ? '' : 's'}`,
    ...rows,
    '   └─ summary',
    `      ├─ ${blockers.length} blockers`,
    `      └─ ${nitpicks.length} nitpicks`,
    '',
    ...(input.points.length === 0
      ? []
      : [
          '🔴 the repair is EJECT, never CUT — the third verdict of',
          '   `rule.require.archaeology-in-notes`. move the passage to a peer artifact and cite',
          '   it by path; a cut loses the evidence the claim rests on.',
          '',
          '   material the yield REJECTED  → `archive/$stone.archaeology.md`',
          '   evidence under a live claim  → `$stone.yield.appendix.$what.md`',
          '',
          '🟡 an uncited ejection is a deletion. the yield must ref what it moved.',
        ]),
  ].join('\n');
};

/**
 * .what = hold a quoted line to one terminal row
 * .why  = a lint that wraps its own evidence is harder to scan than the file it grades
 */
const asClipped = (input: { text: string }): string =>
  input.text.length > 96 ? `${input.text.slice(0, 93)}...` : input.text;
