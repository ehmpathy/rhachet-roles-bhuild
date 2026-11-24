/**
 * .what = tally a route's peer reviews, grouped by lane or by the rule each point cites
 * .why  = the guard reports one round's verdicts; these two counts span the whole route:
 *         - by lane: how many reports and blockers each lane produced, so a lane that
 *           emits reports and cites zero blockers is visible
 *         - by rule: how many points cite each rule, so a bound rule cited zero times
 *           is visible
 */

import {
  computePeerReviewTally,
  type PeerReviewTally,
} from './computePeerReviewTally';
import { getAllPeerReviewReports } from './getAllPeerReviewReports';

/**
 * .what = read the route's reports, then compute their tally
 * .why  = the orchestrator: read the corpus, compute the rows, return
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
  return computePeerReviewTally({
    reports,
    by: input.by,
    corpus: {
      route: input.route,
      lane: input.lane,
      laneWout: input.laneWout,
    },
  });
};
