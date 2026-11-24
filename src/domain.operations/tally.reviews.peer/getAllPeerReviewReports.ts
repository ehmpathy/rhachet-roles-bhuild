/**
 * .what = read the peer-review `.report.md` files on a route that the corpus selects, parsed
 * .why  = the tally's corpus must be named and countable. a selection that matches zero
 *         files throws, since an empty tally and a clean gate render identically.
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { ConstraintError } from 'helpful-errors';
import { join } from 'path';

import {
  asPeerReviewReport,
  type PeerReviewReport,
} from './asPeerReviewReport';
import { getEmptyCorpusHint } from './getEmptyCorpusHint';
import { isPeerReviewReportInScope } from './isPeerReviewReportInScope';

/**
 * .what = enumerate + parse the route's peer-review reports, optionally narrowed to a lane
 * .why  = the communicator half of the tally: the one filesystem read, so the compute
 *         half stays pure
 */
export const getAllPeerReviewReports = (input: {
  route: string;
  lane: string | null;
  laneWout: string[];
}): PeerReviewReport[] => {
  const dir = join(input.route, '.reviews', 'peer');

  // a route whose guard has run no peer lane holds no dir to read
  if (!existsSync(dir))
    ConstraintError.throw('no peer-review dir on that route', {
      route: input.route,
      expected: dir,
      hint: 'confirm the route path, and that its guard has run at least one peer lane',
    });

  const filesInDir = readdirSync(dir);
  const files = filesInDir
    .filter((file) =>
      isPeerReviewReportInScope({
        file,
        lane: input.lane,
        laneWout: input.laneWout,
      }),
    )
    .sort();

  // an empty corpus throws: a zero-row tally reads as a clean gate, not as an empty read
  if (files.length === 0)
    ConstraintError.throw('no peer-review reports matched', {
      dir,
      // keyed as the flags read, and only the flags the caller set
      ...(input.lane === null ? {} : { laneWith: input.lane }),
      ...(input.laneWout.length === 0 ? {} : { laneWout: input.laneWout }),
      hint: getEmptyCorpusHint({
        lane: input.lane,
        laneWout: input.laneWout,
        reportsInDir: filesInDir.filter((file) =>
          isPeerReviewReportInScope({ file, lane: null, laneWout: [] }),
        ).length,
      }),
    });

  return files.map((file) =>
    asPeerReviewReport({
      path: join(dir, file),
      content: readFileSync(join(dir, file), 'utf-8'),
    }),
  );
};
