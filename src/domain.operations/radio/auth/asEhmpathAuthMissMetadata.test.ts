import { asEhmpathAuthMissMetadata } from './asEhmpathAuthMissMetadata';
import type { EhmpathSpotFound } from './EhmpathSpotFound';

const TEST_CASES: {
  description: string;
  given: { auth: string; keyrackFound: EhmpathSpotFound };
  expect: { auth: string; unlockFailure?: string };
}[] = [
  {
    description: 'a failed auto-unlock keeps its raw cause',
    given: {
      auth: 'as-ehmpath',
      keyrackFound: {
        miss: { row: 'keyrack: …', fix: null, cause: 'rhx: not found' },
      },
    },
    expect: { auth: 'as-ehmpath', unlockFailure: 'rhx: not found' },
  },
  {
    description: 'a keyrack miss with no cause carries only the auth value',
    given: {
      auth: 'as-ehmpath',
      keyrackFound: { miss: { row: 'keyrack: …', fix: null, cause: null } },
    },
    expect: { auth: 'as-ehmpath' },
  },
  {
    description: 'keyrack never read carries only the auth value',
    given: { auth: 'as-ehmpath-via-ambient', keyrackFound: null },
    expect: { auth: 'as-ehmpath-via-ambient' },
  },
];

describe('asEhmpathAuthMissMetadata', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asEhmpathAuthMissMetadata(thisCase.given)).toEqual(
        thisCase.expect,
      );
    }),
  );
});
