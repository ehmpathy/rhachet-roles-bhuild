import { getCliArgvTail } from './getCliArgvTail';

const TEST_CASES = [
  {
    description:
      'a `node -e` dispatch names no entry file, so the verb at argv[1] is kept',
    given: { argv: ['/usr/bin/node', 'put'] },
    expect: { output: ['put'] },
  },
  {
    description: 'a `node -e` dispatch with flags keeps every user arg',
    given: { argv: ['/usr/bin/node', 'get', '--when', 'hook.onStop'] },
    expect: { output: ['get', '--when', 'hook.onStop'] },
  },
  {
    description: 'a direct call drops the entry file at argv[1]',
    given: {
      argv: ['/usr/bin/node', '/repo/src/contract/cli/phoneInbox.ts', 'del'],
    },
    expect: { output: ['del'] },
  },
  {
    description: 'a call with no user args yields none',
    given: { argv: ['/usr/bin/node'] },
    expect: { output: [] },
  },
];

describe('getCliArgvTail', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getCliArgvTail({ argv: thisCase.given.argv })).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
