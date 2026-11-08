import { isExecExitError } from './isExecExitError';

const TEST_CASES = [
  {
    description: 'an exit with a numeric code is an exit',
    given: { error: Object.assign(new Error('exit 1'), { code: 1 }) },
    expect: { output: true },
  },
  {
    description: 'a kill at its bound is no exit',
    given: {
      error: Object.assign(new Error('killed'), {
        code: null,
        killed: true,
        signal: 'SIGTERM',
      }),
    },
    expect: { output: false },
  },
  {
    description: 'a numeric code on a killed process is no exit',
    given: {
      error: Object.assign(new Error('killed'), { code: 143, killed: true }),
    },
    expect: { output: false },
  },
  {
    description: 'a spawn fault (a string code) is no exit',
    given: {
      error: Object.assign(new Error('spawn gh ENOENT'), { code: 'ENOENT' }),
    },
    expect: { output: false },
  },
  {
    description: 'a plain error with no code is no exit',
    given: { error: new Error('boom') },
    expect: { output: false },
  },
  {
    description: 'a non-object rejection is no exit',
    given: { error: 'boom' },
    expect: { output: false },
  },
  {
    description: 'a null rejection is no exit',
    given: { error: null },
    expect: { output: false },
  },
];

describe('isExecExitError', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isExecExitError({ error: thisCase.given.error })).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
