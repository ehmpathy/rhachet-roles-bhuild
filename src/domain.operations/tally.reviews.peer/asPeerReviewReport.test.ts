import { getError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { asPeerReviewReport } from './asPeerReviewReport';

const PATH =
  '.behavior/r/.reviews/peer/5.1._.review.i001.abc.r001._.given.by_peer.repo-rules.report.md';

/**
 * .what = a report in the guard's shape, with a summary tree and point blocks
 */
const genReport = (input: {
  summary: { blockers: number; nitpicks: number } | null;
  blocks: string[];
}): string =>
  [
    '🦉 needs your talons',
    '   ├─ logs: .log/bhrain/review/x',
    ...(input.summary
      ? [
          '   └─ summary',
          `      ├─ ${input.summary.blockers} blockers 🔴`,
          `      └─ ${input.summary.nitpicks} nitpicks 🟠`,
        ]
      : []),
    '',
    ...input.blocks.flatMap((block) => ['---', block, '']),
  ].join('\n');

const BLOCKER_ELSE = [
  '# blocker.1: an else branch',
  '',
  '**rule**: .agent/repo=ehmpathy/role=mechanic/briefs/rule.forbid.else-branches.md',
  '',
  'the body names 3 blockers in prose, which must not stand in for the summary.',
].join('\n');

const NITPICK_BREVITY = [
  '# nitpick.1: a ramble',
  '',
  '**rule**: .agent/repo=ehmpathy/role=architect/briefs/rule.require.brevity.md',
].join('\n');

describe('asPeerReviewReport', () => {
  given('[case1] a well-formed report with one blocker and one nitpick', () => {
    when('[t0] it is parsed', () => {
      const report = asPeerReviewReport({
        path: PATH,
        content: genReport({
          summary: { blockers: 1, nitpicks: 1 },
          blocks: [BLOCKER_ELSE, NITPICK_BREVITY],
        }),
      });

      then('the lane is read from the filename', () => {
        expect(report.lane).toEqual('repo-rules');
      });

      then('the counts come from the summary tree, not a prose mention', () => {
        expect(report.blockers).toEqual(1);
        expect(report.nitpicks).toEqual(1);
      });

      then('each point pairs with the rule of its own block', () => {
        expect(report.points).toEqual([
          { severity: 'blocker', rule: 'rule.forbid.else-branches' },
          { severity: 'nitpick', rule: 'rule.require.brevity' },
        ]);
      });
    });
  });

  given('[case2] a clean report with 0 blockers and 0 nitpicks', () => {
    when('[t0] it is parsed', () => {
      const report = asPeerReviewReport({
        path: PATH,
        content: genReport({
          summary: { blockers: 0, nitpicks: 0 },
          blocks: [],
        }),
      });

      then('it reads as zero points', () => {
        expect(report).toEqual({
          path: PATH,
          lane: 'repo-rules',
          blockers: 0,
          nitpicks: 0,
          points: [],
        });
      });
    });
  });

  given('[case3] a report whose summary lines are absent', () => {
    when('[t0] it is parsed', () => {
      then('it throws, rather than default to a silent zero', async () => {
        const error = await getError(async () =>
          asPeerReviewReport({
            path: PATH,
            content: genReport({ summary: null, blocks: [] }),
          }),
        );
        expect(error.message).toContain('no blocker count in the summary');
      });
    });
  });

  given(
    '[case4] a report whose summary disagrees with its point blocks',
    () => {
      when('[t0] it is parsed', () => {
        then('it throws with both counts named', async () => {
          const error = await getError(async () =>
            asPeerReviewReport({
              path: PATH,
              content: genReport({
                summary: { blockers: 2, nitpicks: 1 },
                blocks: [BLOCKER_ELSE, NITPICK_BREVITY],
              }),
            }),
          );
          expect(error.message).toContain(
            'summary counts disagree with the points parsed',
          );
        });
      });
    },
  );

  given('[case5] a point block with no rule line', () => {
    when('[t0] it is parsed', () => {
      then('it throws, since the point cannot be attributed', async () => {
        const error = await getError(async () =>
          asPeerReviewReport({
            path: PATH,
            content: genReport({
              summary: { blockers: 1, nitpicks: 1 },
              blocks: ['# blocker.1: no rule here', NITPICK_BREVITY],
            }),
          }),
        );
        expect(error.message).toContain(
          'a point block owes exactly one rule line',
        );
      });
    });
  });

  given('[case6] a rule line that carries no rule.* slug', () => {
    when('[t0] it is parsed', () => {
      then('it throws with the line named', async () => {
        const error = await getError(async () =>
          asPeerReviewReport({
            path: PATH,
            content: genReport({
              summary: { blockers: 1, nitpicks: 0 },
              blocks: ['# blocker.1: x\n\n**rule**: some-brief.md'],
            }),
          }),
        );
        expect(error.message).toContain('rule line carries no rule.* slug');
      });
    });
  });

  given('[case7] a filename that declares no lane', () => {
    when('[t0] it is parsed', () => {
      then('it throws with the expected shape named', async () => {
        const error = await getError(async () =>
          asPeerReviewReport({
            path: 'some/review.md',
            content: genReport({
              summary: { blockers: 0, nitpicks: 0 },
              blocks: [],
            }),
          }),
        );
        expect(error.message).toContain(
          'report filename declares no lane slug',
        );
      });
    });
  });
});
