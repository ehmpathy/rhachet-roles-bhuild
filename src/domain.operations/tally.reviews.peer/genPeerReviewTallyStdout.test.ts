import { given, then, when } from 'test-fns';

import type { PeerReviewTally } from './computePeerReviewTally';
import { genPeerReviewTallyStdout } from './genPeerReviewTallyStdout';

const TALLY_BY_LANE: PeerReviewTally = {
  by: 'lane',
  corpus: {
    route: '.behavior/r',
    lane: null,
    laneWout: ['mech-'],
    reports: 3,
  },
  totals: { blockers: 2, nitpicks: 1, points: 3 },
  rows: [
    { key: 'prose', reports: 2, blockers: 2, nitpicks: 1, points: 3 },
    { key: 'arch', reports: 1, blockers: 0, nitpicks: 0, points: 0 },
  ],
};

describe('genPeerReviewTallyStdout', () => {
  given('[case1] a tally by lane with a --lane-wout filter', () => {
    when('[t0] it is rendered', () => {
      const stdout = genPeerReviewTallyStdout({ tally: TALLY_BY_LANE });

      then('the corpus, the filter, and the totals sit beside the rows', () => {
        expect(stdout).toContain('├─ lane-wout: mech-');
        expect(stdout).toContain('├─ corpus: 3 reports');
        expect(stdout).toContain('100.0%  prose');
      });

      then('it matches its snapshot', () => {
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] a tally by rule with zero points', () => {
    when('[t0] it is rendered', () => {
      const stdout = genPeerReviewTallyStdout({
        tally: {
          by: 'rule',
          corpus: {
            route: '.behavior/r',
            lane: 'arch',
            laneWout: [],
            reports: 1,
          },
          totals: { blockers: 0, nitpicks: 0, points: 0 },
          rows: [],
        },
      });

      then(
        'the share column has no denominator to divide by, and no row',
        () => {
          expect(stdout).toContain('├─ totals: 0 points');
          expect(stdout).not.toContain('lane-wout');
          expect(stdout).toContain('└─ (none — the corpus cites no rule)');
        },
      );

      then('it matches its snapshot', () => {
        expect(stdout).toMatchSnapshot();
      });
    });
  });
});
