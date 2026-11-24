import * as fs from 'fs';
import { join } from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { getPeerReviewTally } from './getPeerReviewTally';

/**
 * .what = one report in the guard's shape, with one point per given rule
 */
const asReport = (input: {
  points: { severity: 'blocker' | 'nitpick'; rule: string }[];
}): string => {
  const count = (severity: 'blocker' | 'nitpick'): number =>
    input.points.filter((point) => point.severity === severity).length;
  return [
    '   └─ summary',
    `      ├─ ${count('blocker')} blockers 🔴`,
    `      └─ ${count('nitpick')} nitpicks 🟠`,
    '',
    ...input.points.flatMap((point, index) => [
      '---',
      `# ${point.severity}.${index + 1}: a point`,
      '',
      `**rule**: .agent/repo=ehmpathy/role=mechanic/briefs/${point.rule}.md`,
      '',
    ]),
  ].join('\n');
};

describe('getPeerReviewTally', () => {
  given('[case1] a route with two lanes that cite one shared rule', () => {
    const scene = useBeforeAll(async () => {
      const dir = genTempDir({ slug: 'tally-orchestrate' });
      const peer = join(dir, '.reviews', 'peer');
      fs.mkdirSync(peer, { recursive: true });
      fs.writeFileSync(
        join(
          peer,
          's._.review.i001.a.r001._.given.by_peer.repo-rules.report.md',
        ),
        asReport({
          points: [
            { severity: 'blocker', rule: 'rule.forbid.absolutes' },
            { severity: 'nitpick', rule: 'rule.forbid.riddles' },
          ],
        }),
      );
      fs.writeFileSync(
        join(
          peer,
          's._.review.i001.a.r002._.given.by_peer.mech-failhides.report.md',
        ),
        asReport({
          points: [{ severity: 'blocker', rule: 'rule.forbid.absolutes' }],
        }),
      );
      return { route: dir };
    });

    when('[t0] it is tallied by lane', () => {
      then('the read corpus feeds the rows and the totals', () => {
        const tally = getPeerReviewTally({
          route: scene.route,
          by: 'lane',
          lane: null,
          laneWout: [],
        });
        expect(tally.corpus.reports).toEqual(2);
        expect(tally.totals).toEqual({ points: 3, blockers: 2, nitpicks: 1 });
        expect(tally.rows.map((row) => row.key)).toEqual([
          'repo-rules',
          'mech-failhides',
        ]);
      });
    });

    when('[t1] it is tallied by rule, one lane dropped', () => {
      then('the filter applies before the compute', () => {
        const tally = getPeerReviewTally({
          route: scene.route,
          by: 'rule',
          lane: null,
          laneWout: ['mech-'],
        });
        expect(tally.corpus.reports).toEqual(1);
        expect(tally.corpus.laneWout).toEqual(['mech-']);
        expect(tally.rows.map((row) => [row.key, row.points])).toEqual([
          ['rule.forbid.absolutes', 1],
          ['rule.forbid.riddles', 1],
        ]);
      });
    });
  });
});
