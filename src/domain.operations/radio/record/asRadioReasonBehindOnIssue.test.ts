import { asRadioReasonBehindOnIssue } from './asRadioReasonBehindOnIssue';

const TEST_CASES = [
  {
    description: 'reads a minted 16-hex key and its issue',
    given: { reason: 'behind:a1b2c3d4e5f60718 (same issue #599)' },
    expect: { aheadKey: 'a1b2c3d4e5f60718', exid: '599' },
  },
  {
    description: 'reads a hand-named key the dao also reads (legacy-a)',
    given: { reason: 'behind:legacy-a (same issue #7)' },
    expect: { aheadKey: 'legacy-a', exid: '7' },
  },
  {
    description: 'refuses a key outside the dao grammar (a dot)',
    given: { reason: 'behind:../evil (same issue #7)' },
    expect: null,
  },
  {
    description: 'null for a fault reason',
    given: { reason: 'upstream:transient' },
    expect: null,
  },
  {
    description: 'null for no reason',
    given: { reason: null },
    expect: null,
  },
];

describe('asRadioReasonBehindOnIssue', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asRadioReasonBehindOnIssue(thisCase.given)).toEqual(
        thisCase.expect,
      );
    }),
  );
});
