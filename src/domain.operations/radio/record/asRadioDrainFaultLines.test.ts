import { asRadioDrainFaultLines } from './asRadioDrainFaultLines';

const TEST_CASES = [
  {
    description: 'an auth miss nests its checked spots under the fault line',
    given: {
      detail: [
        '✋ ConstraintError: --auth as-ehmpath found no ehmpath token',
        '',
        'checked',
        '├─ keyrack: not granted (status: absent)',
        '└─ ambient: git config user.email = bert@example.com, not an ehmpath email',
        '',
        'fix',
        '└─ send as yourself, on purpose: --auth as-human',
      ].join('\n'),
    },
    expect: {
      output: [
        [
          'fault: ✋ ConstraintError: --auth as-ehmpath found no ehmpath token',
          '└─ checked',
          '   ├─ keyrack: not granted (status: absent)',
          '   └─ ambient: git config user.email = bert@example.com, not an ehmpath email',
        ].join('\n'),
      ],
    },
  },
  {
    description: 'an upstream fault keeps its one line',
    given: {
      detail:
        'GraphQL: Resource not accessible by integration (updateIssue)\nmore stderr',
    },
    expect: {
      output: [
        'fault: GraphQL: Resource not accessible by integration (updateIssue)',
      ],
    },
  },
  {
    description: 'no detail yields no fault line',
    given: { detail: null },
    expect: { output: [] },
  },
];

describe('asRadioDrainFaultLines', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = asRadioDrainFaultLines(thisCase.given);
      expect(output).toEqual(thisCase.expect.output);

      // the lines as a human reads them, joined, for a vibecheck without execution
      expect(output.join('\n')).toMatchSnapshot();
    }),
  );
});
