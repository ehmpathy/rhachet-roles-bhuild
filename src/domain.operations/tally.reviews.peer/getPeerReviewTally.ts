/**
 * .what = tally a route's peer reviews, grouped by lane or by the rule each point cites
 * .why  = two questions a guard cannot answer about itself:
 *         - by lane: which lanes earn their place? a lane with many rounds and no blockers
 *           is a lane that costs a budget round and moves no stone
 *         - by rule: where does the gate spend its attention? a rule bound and never cited
 *           is a rule the gate does not enforce
 */

import { getAllPeerReviewReports } from './getAllPeerReviewReports';

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
 * .what = read the route's reports and group them
 */
export const getPeerReviewTally = (input: {
  route: string;
  by: 'lane' | 'rule';
  lane: string | null;
  laneWout: string[];
}): PeerReviewTally => {
  const reports = getAllPeerReviewReports({
    route: input.route,
    lane: input.lane,
    laneWout: input.laneWout,
  });

  const rows = new Map<string, PeerReviewTallyRow>();
  const upsertRow = (key: string): PeerReviewTallyRow => {
    const found = rows.get(key);
    if (found) return found;
    const made = { key, reports: 0, blockers: 0, nitpicks: 0, points: 0 };
    rows.set(key, made);
    return made;
  };

  for (const report of reports) {
    // by lane: the row is the lane, and the guard's own two counts are the verdict
    if (input.by === 'lane') {
      const row = upsertRow(report.lane);
      row.reports += 1;
      row.blockers += report.blockers;
      row.nitpicks += report.nitpicks;
      row.points += report.points.length;
      continue;
    }

    // by rule: the row is the rule each point cites, so one report feeds many rows
    for (const point of report.points) {
      const row = upsertRow(point.rule);
      row.points += 1;
      if (point.severity === 'blocker') row.blockers += 1;
      else row.nitpicks += 1;
    }
  }

  return {
    by: input.by,
    corpus: {
      route: input.route,
      lane: input.lane,
      laneWout: input.laneWout,
      reports: reports.length,
    },
    totals: {
      blockers: reports.reduce((sum, report) => sum + report.blockers, 0),
      nitpicks: reports.reduce((sum, report) => sum + report.nitpicks, 0),
      points: reports.reduce((sum, report) => sum + report.points.length, 0),
    },
    rows: [...rows.values()].sort(
      (a, b) => b.points - a.points || a.key.localeCompare(b.key),
    ),
  };
};
