import { ConstraintError, MalfunctionError } from 'helpful-errors';

import { asPhoneErrorHeadline } from './asPhoneErrorHeadline';

const TEST_CASES = [
  {
    description: 'a malfunction with context keeps its claim alone',
    given: {
      error: new MalfunctionError('the grove connection gave no answer', {
        grove: 'grove-sandpine-v20260901',
        stderr: 'Error: boom\n    at x',
      }),
    },
    expect: { output: 'the grove connection gave no answer' },
  },
  {
    description: 'a constraint keeps its claim alone',
    given: {
      error: new ConstraintError('grove grove-nope is not registered', {
        path: '/x',
      }),
    },
    expect: { output: 'grove grove-nope is not registered' },
  },
  {
    description: 'a plain error keeps its first line',
    given: { error: new Error('could not reach\nthe second line') },
    expect: { output: 'could not reach' },
  },
  {
    description: 'an error with no message names its class',
    given: { error: new TypeError('') },
    expect: { output: 'TypeError' },
  },
];

describe('asPhoneErrorHeadline', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const output = asPhoneErrorHeadline({ error: thisCase.given.error });
      expect(output).toEqual(thisCase.expect.output);
      expect(output).not.toContain('\n');
    }),
  );
});
