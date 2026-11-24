import { asRadioFaultCheckedLines } from './asRadioFaultCheckedLines';

const TEST_CASES = [
  {
    description: 'a one-spot miss yields its one spot',
    given: {
      detail: [
        '✋ ConstraintError: --auth as-ehmpath-via-ambient found no ehmpath token',
        '',
        'checked',
        '└─ ambient: git config user.email = bert@example.com, not an ehmpath email',
        '',
        'fix',
        '└─ send as yourself, on purpose: --auth as-human',
      ].join('\n'),
    },
    expect: {
      output: [
        'ambient: git config user.email = bert@example.com, not an ehmpath email',
      ],
    },
  },
  {
    description: 'a two-spot miss yields both, in walk order',
    given: {
      detail: [
        '--auth as-ehmpath found no ehmpath token',
        '',
        'checked',
        '├─ keyrack: not granted (status: absent)',
        '└─ ambient: ehmpath email, but gh holds no login',
        '',
        'fix',
        '└─ log gh in as the ehmpath account: gh auth login',
      ].join('\n'),
    },
    expect: {
      output: [
        'keyrack: not granted (status: absent)',
        'ambient: ehmpath email, but gh holds no login',
      ],
    },
  },
  {
    description: 'an upstream fault holds no checked section and yields none',
    given: {
      detail: 'GraphQL: Resource not accessible by integration (updateIssue)',
    },
    expect: { output: [] },
  },
  {
    description: 'no detail yields none',
    given: { detail: null },
    expect: { output: [] },
  },
];

describe('asRadioFaultCheckedLines', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = asRadioFaultCheckedLines(thisCase.given);
      expect(output).toEqual(thisCase.expect.output);

      // the lines as a human reads them, joined, for a vibecheck without execution
      expect(output.join('\n')).toMatchSnapshot();
    }),
  );
});
