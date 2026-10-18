/**
 * .what = parse one peer-review `.report.md` into its lane, its points, and the rule each cites
 * .why  = a lane's verdict counts and its rule citations are the only evidence of what a gate
 *         actually enforces. a bind is not evidence: a rule can be enrolled, blocker-graded,
 *         and cited zero times.
 */

import { MalfunctionError } from 'helpful-errors';

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

// a report filename ends `…_.given.by_peer.<lane>.report.md`
const PATTERN_OF_LANE = /\.given\.by_peer\.([a-z0-9-]+)\.report\.md$/i;

// the guard's own two summary lines, per contract.reviewer-output. they sit inside a
// tree of box glyphs (`├─ 0 blockers`), so the count is never at the line's start
const PATTERN_OF_BLOCKERS = /(\d+)\s+blockers?/i;
const PATTERN_OF_NITPICKS = /(\d+)\s+nitpicks?/i;

// each point opens with `# blocker.N:` or `# nitpick.N:` and carries a `**rule**:` line
const PATTERN_OF_POINT_HEAD = /^#\s+(blocker|nitpick)\.\d+:/gim;
const PATTERN_OF_RULE_LINE = /^\*\*rule\*\*:.*$/gim;
const PATTERN_OF_RULE_SLUG = /rule\.[a-z0-9.-]+/i;

/**
 * .what = parse one report's raw text into its lane, counts, and per-point rule citations
 * .why  = the tally is only as trustworthy as its parse. a point with no paired `**rule**:`
 *         line is a PARSE FAILURE and throws — a silent zero would read as a clean lane,
 *         which is the exact failure `contract.reviewer-output` exists to forbid.
 */
export const asPeerReviewReport = (input: {
  path: string;
  content: string;
}): PeerReviewReport => {
  const lane = input.path.match(PATTERN_OF_LANE)?.[1];
  if (!lane)
    MalfunctionError.throw('report filename declares no lane slug', {
      path: input.path,
      expected: '…_.given.by_peer.<lane>.report.md',
    });

  const heads = input.content.match(PATTERN_OF_POINT_HEAD) ?? [];
  const ruleLines = input.content.match(PATTERN_OF_RULE_LINE) ?? [];

  // 🔴 fail loud on a parse mismatch: every point owes exactly one rule line
  if (heads.length !== ruleLines.length)
    MalfunctionError.throw('point count does not match rule-line count', {
      path: input.path,
      points: heads.length,
      ruleLines: ruleLines.length,
      hint: 'the report format changed, or a point omitted its **rule**: line. do not tally an unparseable report — the zero it would yield is indistinguishable from a clean lane',
    });

  const points = heads.map((head, index): PeerReviewPoint => {
    const severity = /blocker/i.test(head) ? 'blocker' : 'nitpick';
    const rule = ruleLines[index]!.match(PATTERN_OF_RULE_SLUG)?.[0];
    if (!rule)
      MalfunctionError.throw('rule line carries no rule.* slug', {
        path: input.path,
        line: ruleLines[index],
      });
    return { severity, rule: rule.replace(/\.md$/, '') };
  });

  return {
    path: input.path,
    lane: lane!,
    blockers: Number(input.content.match(PATTERN_OF_BLOCKERS)?.[1] ?? 0),
    nitpicks: Number(input.content.match(PATTERN_OF_NITPICKS)?.[1] ?? 0),
    points,
  };
};
