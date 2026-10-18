/**
 * .what = read every peer-review `.report.md` on a route, parsed
 * .why  = the tally's corpus must be named and countable. a filter that matches zero files
 *         must fail loud, since an empty tally and a clean gate render identically.
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { ConstraintError } from 'helpful-errors';
import { join } from 'path';

import {
  asPeerReviewReport,
  type PeerReviewReport,
} from './asPeerReviewReport';

/**
 * .what = enumerate + parse the route's peer-review reports, optionally narrowed to a lane
 */
export const getAllPeerReviewReports = (input: {
  route: string;
  lane: string | null;
  laneWout: string[];
}): PeerReviewReport[] => {
  const dir = join(input.route, '.reviews', 'peer');

  if (!existsSync(dir))
    ConstraintError.throw('no peer-review dir on that route', {
      route: input.route,
      expected: dir,
      hint: 'confirm the route path, and that its guard has run at least one peer lane',
    });

  const files = readdirSync(dir)
    .filter((file) => file.endsWith('.report.md'))
    .filter((file) => (input.lane ? file.includes(input.lane) : true))
    .filter((file) => !input.laneWout.some((wout) => file.includes(wout)))
    .sort();

  // 🔴 an empty corpus is a constraint error, never an empty tally. a zero-row report
  //    reads as "the gate found naught", which is the opposite of "naught was read"
  if (files.length === 0)
    ConstraintError.throw('no peer-review reports matched', {
      dir,
      lane: input.lane,
      laneWout: input.laneWout,
      hint: input.lane
        ? `no report filename contains "${input.lane}" — check the lane slug against the filenames in that dir`
        : 'the dir holds no *.report.md, or every one was excluded — the guard has not yet run a peer lane here',
    });

  return files.map((file) =>
    asPeerReviewReport({
      path: join(dir, file),
      content: readFileSync(join(dir, file), 'utf-8'),
    }),
  );
};
