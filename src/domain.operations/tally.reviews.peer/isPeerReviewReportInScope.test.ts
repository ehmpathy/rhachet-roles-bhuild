import { isPeerReviewReportInScope } from './isPeerReviewReportInScope';

const REPORT = 'x._.given.by_peer.prose-of-briefs.report.md';

const TEST_CASES = [
  {
    description: 'a report with no filter is in scope',
    given: { file: REPORT, lane: null, laneWout: [] },
    expect: true,
  },
  {
    description: 'the .given wrapper beside a report is out of scope',
    given: {
      file: 'x._.given.by_peer.prose-of-briefs.md',
      lane: null,
      laneWout: [],
    },
    expect: false,
  },
  {
    description: '--lane-with keeps a filename that holds its slug',
    given: { file: REPORT, lane: 'prose-of', laneWout: [] },
    expect: true,
  },
  {
    description: '--lane-with drops a filename that lacks its slug',
    given: { file: REPORT, lane: 'mech-', laneWout: [] },
    expect: false,
  },
  {
    description: '--lane-wout drops a filename that holds any of its slugs',
    given: { file: REPORT, lane: null, laneWout: ['mech-', 'briefs'] },
    expect: false,
  },
  {
    description: '--lane-wout keeps a filename that holds none of its slugs',
    given: { file: REPORT, lane: null, laneWout: ['mech-'] },
    expect: true,
  },
];

describe('isPeerReviewReportInScope', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isPeerReviewReportInScope(thisCase.given)).toEqual(
        thisCase.expect,
      );
    }),
  );
});
