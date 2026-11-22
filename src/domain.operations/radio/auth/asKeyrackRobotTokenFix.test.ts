import { asKeyrackRobotTokenFix } from './asKeyrackRobotTokenFix';

const COORDINATE = {
  owner: 'ehmpath',
  env: 'prep',
  key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
};

const TEST_CASES: { description: string; status: string; expect: string }[] = [
  {
    description: 'locked → unlock, with the full coordinate',
    status: 'locked',
    expect:
      'unlock the robot token: rhx keyrack unlock --owner ehmpath --key EHMPATH_BEAVER_GITHUB_TOKEN --env prep',
  },
  {
    description: 'absent → set, with the full coordinate',
    status: 'absent',
    expect:
      'set the robot token: rhx keyrack set --owner ehmpath --key EHMPATH_BEAVER_GITHUB_TOKEN --env prep',
  },
  {
    description: 'blocked → status, since unlock or set cannot clear a policy',
    status: 'blocked',
    expect: 'inspect the block: rhx keyrack status --owner ehmpath',
  },
  {
    description: 'an unknown status → status, never a guess at unlock or set',
    status: 'weird',
    expect: 'inspect the block: rhx keyrack status --owner ehmpath',
  },
];

describe('asKeyrackRobotTokenFix', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const fix = asKeyrackRobotTokenFix({
        ...COORDINATE,
        status: thisCase.status,
      });
      expect(fix).toEqual(thisCase.expect);
    }),
  );
});
