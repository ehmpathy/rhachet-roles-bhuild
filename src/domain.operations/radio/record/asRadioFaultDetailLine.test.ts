import { asRadioFaultDetailLine } from './asRadioFaultDetailLine';

const TEST_CASES = [
  {
    description: 'the first line of a gh error, verbatim',
    given: {
      detail:
        'GraphQL: Resource not accessible by integration (updateIssue)\nsecond line',
    },
    expect: {
      output:
        'fault: GraphQL: Resource not accessible by integration (updateIssue)',
    },
  },
  {
    description: 'blank lines before the text are skipped',
    given: { detail: '\n  \n  HTTP 502: Bad Gateway  ' },
    expect: { output: 'fault: HTTP 502: Bad Gateway' },
  },
  {
    description:
      'an exec failure skips its own command header for the gh words after it',
    given: {
      detail:
        '💥 MalfunctionError: Command failed: gh issue edit 599 --repo sandpine/svc-lessons --body-file "/tmp/radio-task-edit-1.md"\nGraphQL: Resource not accessible by integration (updateIssue)',
    },
    expect: {
      output:
        'fault: GraphQL: Resource not accessible by integration (updateIssue)',
    },
  },
  {
    description:
      'an exec failure with no words after its header keeps the header',
    given: { detail: 'Command failed: gh issue list' },
    expect: { output: 'fault: Command failed: gh issue list' },
  },
  {
    description: 'a record that awaits a promise reads as a wait, not a fault',
    given: {
      detail: 'public repo, no anonymized promise on this record',
      reason: 'public-repo:unpromised',
    },
    expect: {
      output: 'awaits: public repo, no anonymized promise on this record',
    },
  },
  {
    description: 'an unreadable repo is still a fault',
    given: {
      detail: 'visibility unreadable — treated as public',
      reason: 'public-repo:unreadable',
    },
    expect: { output: 'fault: visibility unreadable — treated as public' },
  },
  {
    description:
      'a helpful-errors class header is cut, since the fault label already says so',
    given: {
      detail:
        '✋ ConstraintError: --auth as-robot:env(TOKEN) specified but TOKEN is not set\nhint: export it',
    },
    expect: {
      output:
        'fault: --auth as-robot:env(TOKEN) specified but TOKEN is not set',
    },
  },
  {
    description: 'no detail yields no line',
    given: { detail: null },
    expect: { output: null },
  },
  {
    description: 'a blank detail yields no line',
    given: { detail: '  \n ' },
    expect: { output: null },
  },
];

describe('asRadioFaultDetailLine', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asRadioFaultDetailLine({ reason: null, ...thisCase.given }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
