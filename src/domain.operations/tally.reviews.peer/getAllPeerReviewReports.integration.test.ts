import * as fs from 'fs';
import { join } from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  when,
} from 'test-fns';

import { getAllPeerReviewReports } from './getAllPeerReviewReports';

/**
 * .what = one report in the guard's shape, with one blocker that cites the given rule
 */
const asReport = (input: { rule: string }): string =>
  [
    '   └─ summary',
    '      ├─ 1 blocker 🔴',
    '      └─ 0 nitpicks',
    '',
    '---',
    '# blocker.1: a point',
    '',
    `**rule**: .agent/repo=ehmpathy/role=mechanic/briefs/${input.rule}.md`,
  ].join('\n');

/**
 * .what = a route dir whose peer dir holds two lanes' reports and one `.given` wrapper
 */
const genRoute = (input: { slug: string }): string => {
  const route = genTempDir({ slug: input.slug });
  const peer = join(route, '.reviews', 'peer');
  fs.mkdirSync(peer, { recursive: true });
  fs.writeFileSync(
    join(peer, 's._.review.i001.a.r001._.given.by_peer.repo-rules.report.md'),
    asReport({ rule: 'rule.forbid.absolutes' }),
  );
  fs.writeFileSync(
    join(
      peer,
      's._.review.i001.a.r002._.given.by_peer.mech-failhides.report.md',
    ),
    asReport({ rule: 'rule.forbid.failhide' }),
  );
  fs.writeFileSync(
    join(peer, 's._.review.i001.a.r001._.given.by_peer.repo-rules.md'),
    'the wrapper the guard renders beside each report',
  );
  return route;
};

describe('getAllPeerReviewReports', () => {
  given('[case1] a route with two lanes of reports', () => {
    const scene = useBeforeAll(async () => ({
      route: genRoute({ slug: 'tally-read-two' }),
    }));

    when('[t0] the whole corpus is read', () => {
      then('each report is parsed, and the `.given` wrapper is skipped', () => {
        const reports = getAllPeerReviewReports({
          route: scene.route,
          lane: null,
          laneWout: [],
        });
        expect(reports.map((report) => report.lane)).toEqual([
          'repo-rules',
          'mech-failhides',
        ]);
      });
    });

    when('[t1] --lane-with narrows to one lane', () => {
      then('only that lane is read', () => {
        const reports = getAllPeerReviewReports({
          route: scene.route,
          lane: 'mech-',
          laneWout: [],
        });
        expect(reports.map((report) => report.lane)).toEqual([
          'mech-failhides',
        ]);
      });
    });

    when('[t2] --lane-with names no report', () => {
      then('it throws a constraint whose hint names the slug', async () => {
        const error = await getError(async () =>
          getAllPeerReviewReports({
            route: scene.route,
            lane: 'absent-lane',
            laneWout: [],
          }),
        );
        expect(error.message).toContain('no peer-review reports matched');
        expect(error.message).toContain('absent-lane');
      });
    });

    when('[t3] --lane-wout drops every report', () => {
      then('it throws a constraint, never an empty tally', async () => {
        const error = await getError(async () =>
          getAllPeerReviewReports({
            route: scene.route,
            lane: null,
            laneWout: ['repo-rules', 'mech-failhides'],
          }),
        );
        expect(error.message).toContain('no peer-review reports matched');
      });
    });
  });

  given('[case2] a route with no peer dir', () => {
    const scene = useBeforeAll(async () => ({
      route: genTempDir({ slug: 'tally-read-absent' }),
    }));

    when('[t0] it is read', () => {
      then('it throws a constraint that names the expected dir', async () => {
        const error = await getError(async () =>
          getAllPeerReviewReports({
            route: scene.route,
            lane: null,
            laneWout: [],
          }),
        );
        expect(error.message).toContain('no peer-review dir on that route');
        expect(error.message).toContain(join('.reviews', 'peer'));
      });
    });
  });
});
