import { given, then, useThen, when } from 'test-fns';

import { asReviewerOutputLines } from './asReviewerOutputLines';

const CONCERN_A = {
  what: 'concern a',
  fix: 'fix a',
  severity: 'better' as const,
};
const CONCERN_B = {
  what: 'concern b',
  fix: 'fix b',
  severity: 'urgent' as const,
};

// the head the caller supplies above these lines, so a snapshot reads as one whole tree
const HEAD_OF_CALLER = ['🦫 root purpose', '   ├─ section: present'];

const TEST_CASES: {
  description: string;
  given: Parameters<typeof asReviewerOutputLines>[0];
  expect: { summary: [string, string] };
}[] = [
  {
    description: 'no concerns: the summary alone, both counts at zero',
    given: { blockers: [], nitpicks: [] },
    expect: { summary: ['0 blockers', '0 nitpicks'] },
  },
  {
    description: 'two blockers and one nitpick: each under its own kind',
    given: { blockers: [CONCERN_A, CONCERN_B], nitpicks: [CONCERN_A] },
    expect: { summary: ['2 blockers', '1 nitpick'] },
  },
];

describe('asReviewerOutputLines', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the concerns are cast to output lines', () => {
        const result = useThen('it casts', async () => ({
          lines: asReviewerOutputLines(thisCase.given),
        }));

        then('ends in both numeric lines, every time', () => {
          expect(result.lines.slice(-2)).toEqual([
            `      ├─ ${thisCase.expect.summary[0]}`,
            `      └─ ${thisCase.expect.summary[1]}`,
          ]);
        });

        then('labels each concern by its own kind and its own severity', () => {
          const asLabels = (input: {
            kind: string;
            concerns: { severity: string }[];
          }): string[] =>
            input.concerns.map(
              (concern) => `[${input.kind}][${concern.severity}]`,
            );
          const labels = result.lines
            .map((line) =>
              line.match(/\[(blocker|nitpick)\]\[(urgent|better)\]/),
            )
            .flatMap((match) => (match ? [match[0]] : []));
          expect(labels).toEqual([
            ...asLabels({ kind: 'blocker', concerns: thisCase.given.blockers }),
            ...asLabels({ kind: 'nitpick', concerns: thisCase.given.nitpicks }),
          ]);
        });

        then('matches the snapshot, under the head its caller supplies', () => {
          expect(
            [...HEAD_OF_CALLER, ...result.lines].join('\n'),
          ).toMatchSnapshot();
        });
      });
    }),
  );
});
