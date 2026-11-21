import { given, then } from 'test-fns';

import { asRadioErrorFixLines } from './asRadioErrorFixLines';

const TEST_CASES: {
  description: string;
  given: { message: string };
  expect: { headline: string; hints: string[] };
}[] = [
  {
    description:
      'an exec failure: the upstream line leads, our own command and temp path never show',
    given: {
      message:
        '💥 MalfunctionError: Command failed: gh issue comment 489 --repo sandpine/svc-lessons --body-file /tmp/radio-task-a1b2c3/body.md\nPost "https://api.github.com/graphql": dial tcp: lookup api.github.com: i/o timeout',
    },
    expect: {
      headline:
        'Post "https://api.github.com/graphql": dial tcp: lookup api.github.com: i/o timeout',
      hints: [],
    },
  },
  {
    description:
      'an exec failure with more upstream lines: the first leads, the rest are hints',
    given: {
      message:
        'Command failed: gh issue edit 599 --repo sandpine/svc-lessons\nGraphQL: Resource not accessible by integration (updateIssue)\n  • re-run as human: --auth as-human',
    },
    expect: {
      headline: 'GraphQL: Resource not accessible by integration (updateIssue)',
      hints: ['re-run as human: --auth as-human'],
    },
  },
  {
    description:
      'an exec header with naught beneath it: the header is all there is, so it leads',
    given: { message: 'Command failed: gh issue list' },
    expect: { headline: 'Command failed: gh issue list', hints: [] },
  },
  {
    description:
      'a qualified error with hints: its first line leads, class header kept',
    given: {
      message:
        '✋ ConstraintError: github auth via keyrack failed: EHMPATH_BEAVER_GITHUB_TOKEN (status: absent)\n  • unblock now — re-run as human: --auth as-human',
    },
    expect: {
      headline:
        '✋ ConstraintError: github auth via keyrack failed: EHMPATH_BEAVER_GITHUB_TOKEN (status: absent)',
      hints: ['unblock now — re-run as human: --auth as-human'],
    },
  },
];

describe('asRadioErrorFixLines', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then('it splits the headline from the hints', () => {
        expect(asRadioErrorFixLines(thisCase.given)).toEqual(thisCase.expect);
      });
    }),
  );
});
