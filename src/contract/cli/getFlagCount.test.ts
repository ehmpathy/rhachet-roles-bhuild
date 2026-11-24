import { getFlagCount } from './getFlagCount';

const TEST_CASES = [
  {
    description: 'counts the spaced form once',
    given: { argv: ['--lane-wout', 'mech-'], flag: 'lane-wout' },
    expect: { output: 1 },
  },
  {
    description: 'counts the equals form once',
    given: { argv: ['--lane-wout=mech-'], flag: 'lane-wout' },
    expect: { output: 1 },
  },
  {
    description: 'returns zero when the flag is absent',
    given: { argv: ['--route', '.behavior/x'], flag: 'lane-wout' },
    expect: { output: 0 },
  },
  {
    description: 'counts a repeat across both forms',
    given: {
      argv: ['--lane-wout', 'mech-', '--lane-wout=arch-'],
      flag: 'lane-wout',
    },
    expect: { output: 2 },
  },
  {
    description: 'never counts a longer flag whose name only shares a prefix',
    given: {
      argv: ['--lane-with', 'mech-', '--lane-wout', 'arch-'],
      flag: 'lane',
    },
    expect: { output: 0 },
  },
];

describe('getFlagCount', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getFlagCount(thisCase.given)).toEqual(thisCase.expect.output);
    }),
  );
});
