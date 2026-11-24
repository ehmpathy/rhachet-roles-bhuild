import { asNounForCount } from './asNounForCount';

const TEST_CASES = [
  {
    description: 'one reads singular',
    given: { count: 1, noun: 'report' },
    expect: { output: 'report' },
  },
  {
    description: 'zero reads plural',
    given: { count: 0, noun: 'nitpick' },
    expect: { output: 'nitpicks' },
  },
  {
    description: 'many reads plural',
    given: { count: 3, noun: 'blocker' },
    expect: { output: 'blockers' },
  },
];

describe('asNounForCount', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asNounForCount(thisCase.given)).toEqual(thisCase.expect.output);
    }),
  );
});
