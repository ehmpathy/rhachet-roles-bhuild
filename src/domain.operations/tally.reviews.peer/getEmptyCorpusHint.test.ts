import { getEmptyCorpusHint } from './getEmptyCorpusHint';

const TEST_CASES = [
  {
    description: 'an empty dir names the command that writes a report',
    given: { lane: null, laneWout: [], reportsInDir: 0 },
    expect: 'rhx route.stone.set --stone <stone> --as arrived',
  },
  {
    description: 'an empty dir is named even when a filter was passed',
    given: { lane: 'prose-of', laneWout: ['mech-'], reportsInDir: 0 },
    expect: 'the dir holds no *.report.md',
  },
  {
    description: 'a --lane-with filter that matched naught names the slug',
    given: { lane: 'prose-of', laneWout: [], reportsInDir: 3 },
    expect: 'no report filename contains "prose-of"',
  },
  {
    description:
      'a --lane-wout list that dropped all names the list and the count',
    given: { lane: null, laneWout: ['mech-', 'arch-'], reportsInDir: 3 },
    expect: '--lane-wout mech-,arch- dropped all 3 reports',
  },
];

describe('getEmptyCorpusHint', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getEmptyCorpusHint(thisCase.given)).toContain(thisCase.expect);
    }),
  );
});
