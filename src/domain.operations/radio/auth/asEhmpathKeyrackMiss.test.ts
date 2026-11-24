import { ConstraintError } from 'helpful-errors';

import { asEhmpathKeyrackMiss } from './asEhmpathKeyrackMiss';

const COORDINATE = {
  owner: 'ehmpath',
  env: 'prep',
  key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
};

const TEST_CASES: {
  description: string;
  given: { metadata: Record<string, string> };
  expect: { row: string; fix: string | null; cause: string | null };
}[] = [
  {
    description: 'a locked refusal names unlock, and keeps no cause',
    given: { metadata: { status: 'locked' } },
    expect: {
      row: 'keyrack: not granted (status: locked)',
      fix: 'unlock the robot token: rhx keyrack unlock --owner ehmpath --key EHMPATH_BEAVER_GITHUB_TOKEN --env prep',
      cause: null,
    },
  },
  {
    description: 'a refusal with no status reads as absent, and names set',
    given: { metadata: { owner: 'ehmpath' } },
    expect: {
      row: 'keyrack: not granted (status: absent)',
      fix: 'set the robot token: rhx keyrack set --owner ehmpath --key EHMPATH_BEAVER_GITHUB_TOKEN --env prep',
      cause: null,
    },
  },
  {
    description: 'a failed auto-unlock keeps its raw cause',
    given: {
      metadata: { status: 'locked', unlockFailure: 'rhx: command not found' },
    },
    expect: {
      row: 'keyrack: not granted (status: locked)',
      fix: 'unlock the robot token: rhx keyrack unlock --owner ehmpath --key EHMPATH_BEAVER_GITHUB_TOKEN --env prep',
      cause: 'rhx: command not found',
    },
  },
  {
    description: 'a blocked refusal names status',
    given: { metadata: { status: 'blocked' } },
    expect: {
      row: 'keyrack: not granted (status: blocked)',
      fix: 'inspect the block: rhx keyrack status --owner ehmpath',
      cause: null,
    },
  },
];

describe('asEhmpathKeyrackMiss', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const error = new ConstraintError('keyrack refused', {
        ...thisCase.given.metadata,
      });
      expect(asEhmpathKeyrackMiss({ error, coordinate: COORDINATE })).toEqual(
        thisCase.expect,
      );
    }),
  );
});
