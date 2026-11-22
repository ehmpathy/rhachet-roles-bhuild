import { asExecExitCode } from './asExecExitCode';

const TEST_CASES: {
  description: string;
  error: unknown;
  expect: number | null;
}[] = [
  {
    description: 'reads the exit code of a command that exited non-zero',
    error: Object.assign(new Error('Command failed'), { code: 1 }),
    expect: 1,
  },
  {
    description: 'reads a command-not-found exit code',
    error: { code: 127, message: 'not found' },
    expect: 127,
  },
  {
    description: 'returns null for a kill, whose code is null',
    error: Object.assign(new Error('killed'), { code: null, killed: true }),
    expect: null,
  },
  {
    description: 'returns null for a spawn fault, whose code is a string',
    error: Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' }),
    expect: null,
  },
  {
    description: 'returns null for a non-object rejection',
    error: 'boom',
    expect: null,
  },
];

describe('asExecExitCode', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asExecExitCode({ error: thisCase.error })).toEqual(
        thisCase.expect,
      );
    }),
  );
});
