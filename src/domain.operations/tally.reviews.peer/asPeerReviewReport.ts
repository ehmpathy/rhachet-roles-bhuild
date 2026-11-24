/**
 * .what = parse one peer-review `.report.md` into its lane, its points, and the rule each cites
 * .why  = a lane's verdict counts and its rule citations are the evidence of what a gate
 *         enforces. a bind is not evidence: a rule can be enrolled, blocker-graded, and
 *         cited zero times.
 */

import { MalfunctionError } from 'helpful-errors';

/**
 * .what = the next move for any report the parse refuses
 * .why  = the guard wrote the report, so the fix is a fresh write or an exclusion, never a
 *         hand edit of a review the guard owns
 */
const HINT_MALFORMED =
  "re-arrive the stone so its guard re-writes that lane's report, or tally without it via --lane-wout <lane>";

/**
 * .what = one graded point inside a review report
 */
export interface PeerReviewPoint {
  severity: 'blocker' | 'nitpick';
  rule: string;
}

/**
 * .what = one peer-review report, parsed
 */
export interface PeerReviewReport {
  path: string;
  lane: string;
  blockers: number;
  nitpicks: number;
  points: PeerReviewPoint[];
}

/**
 * .what = parse one report's raw text into its lane, counts, and per-point rule citations
 * .why  = the tally is as trustworthy as its parse. an absent summary count, a point block
 *         with other than one `**rule**:` line, or a summary that disagrees with the points
 *         is a PARSE FAILURE and throws: a silent zero reads as a clean lane, the failure
 *         `contract.reviewer-output` forbids.
 */
export const asPeerReviewReport = (input: {
  path: string;
  content: string;
}): PeerReviewReport => {
  // the lane rides in the filename
  const lane = asLaneFromReportPath({ path: input.path });

  // each point is its own block, so a rule line pairs with the head above it
  const points = asPeerReviewPointBlocks({ content: input.content }).map(
    (block) => asPeerReviewPoint({ path: input.path, block }),
  );

  // the guard's summary counts, which must agree with the points parsed
  const blockers = asSummaryCount({ ...input, severity: 'blocker' });
  const nitpicks = asSummaryCount({ ...input, severity: 'nitpick' });
  const pointCounts = {
    blockers: points.filter((point) => point.severity === 'blocker').length,
    nitpicks: points.filter((point) => point.severity === 'nitpick').length,
  };
  if (blockers !== pointCounts.blockers || nitpicks !== pointCounts.nitpicks)
    MalfunctionError.throw('summary counts disagree with the points parsed', {
      path: input.path,
      summary: { blockers, nitpicks },
      points: pointCounts,
      hint: `the tally refuses a report whose summary and body disagree; either count would be a guess. ${HINT_MALFORMED}`,
    });

  return { path: input.path, lane, blockers, nitpicks, points };
};

/**
 * .what = the lane slug a report's filename declares: `…_.given.by_peer.<lane>.report.md`
 * .why  = the report body never names its lane, so a filename with no slug throws
 */
const asLaneFromReportPath = (input: { path: string }): string =>
  input.path.match(/\.given\.by_peer\.([a-z0-9-]+)\.report\.md$/i)?.[1] ??
  MalfunctionError.throw('report filename declares no lane slug', {
    path: input.path,
    expected: '…_.given.by_peer.<lane>.report.md',
    hint: HINT_MALFORMED,
  });

/**
 * .what = split a report into its point blocks, one per `# blocker.N:` or `# nitpick.N:` head
 * .why  = a rule line binds to the head of its own block, never to a head by array position
 */
const asPeerReviewPointBlocks = (input: { content: string }): string[] =>
  input.content
    .split(/^(?=#\s+(?:blocker|nitpick)\.\d+:)/im)
    .filter((block) => /^#\s+(?:blocker|nitpick)\.\d+:/i.test(block));

/**
 * .what = parse one point block into its severity and the rule slug it cites
 * .why  = a block with zero or several `**rule**:` lines, or a rule line with no slug, throws
 */
const asPeerReviewPoint = (input: {
  path: string;
  block: string;
}): PeerReviewPoint => {
  const severity = /^#\s+blocker/i.test(input.block) ? 'blocker' : 'nitpick';
  const ruleLines = input.block.match(/^\*\*rule\*\*:.*$/gim) ?? [];
  const [ruleLine] = ruleLines;
  if (ruleLines.length !== 1 || ruleLine === undefined)
    return MalfunctionError.throw('a point block owes exactly one rule line', {
      path: input.path,
      head: input.block.split('\n')[0],
      ruleLines: ruleLines.length,
      hint: HINT_MALFORMED,
    });
  const rule =
    ruleLine.match(/rule\.[a-z0-9.-]+/i)?.[0] ??
    MalfunctionError.throw('rule line carries no rule.* slug', {
      path: input.path,
      line: ruleLine,
      hint: HINT_MALFORMED,
    });
  return { severity, rule: rule.replace(/\.md$/, '') };
};

/**
 * .what = read one summary count from the guard's tree line, e.g. `├─ 2 blockers 🔴`
 * .why  = the pattern anchors on a tree glyph at line start, so a prose mention of "3 blockers"
 *         in a point body does not match; an absent line throws
 */
const asSummaryCount = (input: {
  path: string;
  content: string;
  severity: 'blocker' | 'nitpick';
}): number => {
  const pattern = new RegExp(
    `^\\s*[├└]─\\s+(\\d+)\\s+${input.severity}s?\\b`,
    'im',
  );
  const count = input.content.match(pattern)?.[1];
  if (count === undefined)
    return MalfunctionError.throw(`no ${input.severity} count in the summary`, {
      path: input.path,
      expected: `a summary tree line such as \`├─ 0 ${input.severity}s\``,
      hint: HINT_MALFORMED,
    });
  return Number(count);
};
