import { given, then, when } from 'test-fns';

import type { PeerReviewReport } from './asPeerReviewReport';
import { computePeerReviewTally } from './computePeerReviewTally';

const CORPUS = { route: '.behavior/r', lane: null, laneWout: [] };

const REPORTS: PeerReviewReport[] = [
  {
    path: 'a.given.by_peer.prose.report.md',
    lane: 'prose',
    blockers: 1,
    nitpicks: 1,
    points: [
      { severity: 'blocker', rule: 'rule.forbid.absolutes' },
      { severity: 'nitpick', rule: 'rule.forbid.riddles' },
    ],
  },
  {
    path: 'b.given.by_peer.prose.report.md',
    lane: 'prose',
    blockers: 1,
    nitpicks: 0,
    points: [{ severity: 'blocker', rule: 'rule.forbid.absolutes' }],
  },
  {
    path: 'c.given.by_peer.mech.report.md',
    lane: 'mech',
    blockers: 0,
    nitpicks: 0,
    points: [],
  },
];

describe('computePeerReviewTally', () => {
  given('[case1] three reports across two lanes', () => {
    when('[t0] the tally is grouped by lane', () => {
      const tally = computePeerReviewTally({
        reports: REPORTS,
        by: 'lane',
        corpus: CORPUS,
      });

      then('each lane is one row, ranked by points then key', () => {
        expect(tally.rows).toEqual([
          { key: 'prose', reports: 2, blockers: 2, nitpicks: 1, points: 3 },
          { key: 'mech', reports: 1, blockers: 0, nitpicks: 0, points: 0 },
        ]);
      });

      then('the totals sum every report, and the corpus counts them', () => {
        expect(tally.totals).toEqual({ blockers: 2, nitpicks: 1, points: 3 });
        expect(tally.corpus.reports).toEqual(3);
      });
    });

    when('[t1] the tally is grouped by rule', () => {
      const tally = computePeerReviewTally({
        reports: REPORTS,
        by: 'rule',
        corpus: CORPUS,
      });

      then(
        'each cited rule is one row; a lane with no points adds no row',
        () => {
          expect(tally.rows).toEqual([
            {
              key: 'rule.forbid.absolutes',
              reports: 2,
              blockers: 2,
              nitpicks: 0,
              points: 2,
            },
            {
              key: 'rule.forbid.riddles',
              reports: 1,
              blockers: 0,
              nitpicks: 1,
              points: 1,
            },
          ]);
        },
      );

      then('the totals match the by-lane totals', () => {
        expect(tally.totals).toEqual({ blockers: 2, nitpicks: 1, points: 3 });
      });
    });
  });

  given('[case2] an empty report list', () => {
    when('[t0] the tally is computed', () => {
      const tally = computePeerReviewTally({
        reports: [],
        by: 'lane',
        corpus: CORPUS,
      });

      then('it holds zero rows and zero totals', () => {
        expect(tally.rows).toEqual([]);
        expect(tally.totals).toEqual({ blockers: 0, nitpicks: 0, points: 0 });
      });
    });
  });
});
