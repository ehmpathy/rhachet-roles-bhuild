/**
 * .what = group parsed peer-review reports into tally rows, by lane or by cited rule
 * .why  = the compute half of the tally, kept pure so the orchestrator reads as narrative
 *         and each group rule can be tested with no filesystem
 */

import type { PeerReviewReport } from './asPeerReviewReport';

/**
 * .what = one row of a tally, whatever it is grouped by
 */
export interface PeerReviewTallyRow {
  key: string;
  reports: number;
  blockers: number;
  nitpicks: number;
  points: number;
}

/**
 * .what = the full tally, plus the corpus it was derived from
 */
export interface PeerReviewTally {
  by: 'lane' | 'rule';
  corpus: {
    route: string;
    lane: string | null;
    laneWout: string[];
    reports: number;
  };
  totals: { blockers: number; nitpicks: number; points: number };
  rows: PeerReviewTallyRow[];
}

/**
 * .what = one contribution to a row: a whole report (by lane) or one point (by rule)
 */
interface PeerReviewTallyEntry {
  key: string;
  path: string;
  blockers: number;
  nitpicks: number;
  points: number;
}

/**
 * .what = compute the tally from the reports the corpus selected
 * .why  = rows rank by points, then by key, so the busiest lane or rule leads
 */
export const computePeerReviewTally = (input: {
  reports: PeerReviewReport[];
  by: 'lane' | 'rule';
  corpus: { route: string; lane: string | null; laneWout: string[] };
}): PeerReviewTally => {
  const entries = asPeerReviewTallyEntries(input);
  const keys = [...new Set(entries.map((entry) => entry.key))];
  const rows = keys.map((key) =>
    computeTallyRow({
      key,
      entries: entries.filter((entry) => entry.key === key),
    }),
  );
  const { blockers, nitpicks, points } = computeTallyRow({
    key: '@all',
    entries,
  });

  return {
    by: input.by,
    corpus: { ...input.corpus, reports: input.reports.length },
    totals: { blockers, nitpicks, points },
    rows: asTallyRowsRanked({ rows }),
  };
};

/**
 * .what = cast reports into entries: one per report by lane, one per point by rule
 * .why  = one entry shape lets one row sum serve both groupings
 */
const asPeerReviewTallyEntries = (input: {
  reports: PeerReviewReport[];
  by: 'lane' | 'rule';
}): PeerReviewTallyEntry[] => {
  // by lane: the entry is the report, and the guard's own counts are its verdict
  if (input.by === 'lane')
    return input.reports.map((report) => ({
      key: report.lane,
      path: report.path,
      blockers: report.blockers,
      nitpicks: report.nitpicks,
      points: report.points.length,
    }));

  // by rule: the entry is one point, keyed on the rule it cites
  return input.reports.flatMap((report) =>
    report.points.map((point) => ({
      key: point.rule,
      path: report.path,
      blockers: point.severity === 'blocker' ? 1 : 0,
      nitpicks: point.severity === 'nitpick' ? 1 : 0,
      points: 1,
    })),
  );
};

/**
 * .what = sum one key's entries into a row; reports counts the distinct report files
 * .why  = by rule, one report yields many entries, so a raw entry count would overstate reports
 */
const computeTallyRow = (input: {
  key: string;
  entries: PeerReviewTallyEntry[];
}): PeerReviewTallyRow => ({
  key: input.key,
  reports: new Set(input.entries.map((entry) => entry.path)).size,
  blockers: sumOf(input.entries.map((entry) => entry.blockers)),
  nitpicks: sumOf(input.entries.map((entry) => entry.nitpicks)),
  points: sumOf(input.entries.map((entry) => entry.points)),
});

/**
 * .what = rank rows by points, most first; a tie ranks by key, in code-unit order
 * .why  = the busiest lane or rule leads, and the order is a pure function of the
 *         corpus — localeCompare would read the host's collation
 */
const asTallyRowsRanked = (input: {
  rows: PeerReviewTallyRow[];
}): PeerReviewTallyRow[] =>
  [...input.rows].sort(
    (a, b) => b.points - a.points || asCodeUnitOrder({ a: a.key, b: b.key }),
  );

/**
 * .what = compare two strings by utf-16 code unit, the locale-free total order
 * .why  = a tie-break must give one order on every host
 */
const asCodeUnitOrder = (input: { a: string; b: string }): number => {
  if (input.a < input.b) return -1;
  if (input.a > input.b) return 1;
  return 0;
};

/**
 * .what = the sum of a list of counts
 * .why  = names the fold, so each row field reads as one call
 */
const sumOf = (counts: number[]): number =>
  counts.reduce((sum, count) => sum + count, 0);
