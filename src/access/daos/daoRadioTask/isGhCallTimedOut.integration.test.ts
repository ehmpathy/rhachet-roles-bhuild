import { execFile } from 'child_process';
import { given, then, useThen, when } from 'test-fns';
import { promisify } from 'util';

import { isGhCallTimedOut } from './isGhCallTimedOut';

const execFileAsync = promisify(execFile);

/**
 * .what = the error a real exec rejects with, or null if it did not reject
 * .why = the fields node sets (killed, signal, code) are the contract under test; a fake
 *        error shape would prove only the fake
 */
const getExecError = async (input: {
  file: string;
  args: string[];
  options: { timeout?: number; maxBuffer?: number };
}): Promise<unknown> =>
  execFileAsync(input.file, input.args, input.options).then(
    () => null,
    (error: unknown) => error,
  );

describe('isGhCallTimedOut', () => {
  given('[case1] an exec killed by its timeout', () => {
    when('[t0] the call outlasts a 100ms timeout', () => {
      const error = useThen('it rejects', async () =>
        getExecError({ file: 'sleep', args: ['5'], options: { timeout: 100 } }),
      );
      then('it reads as timed out', () => {
        expect(isGhCallTimedOut({ error })).toEqual(true);
      });
    });
  });

  given('[case2] an exec whose output overran maxBuffer', () => {
    when('[t0] the call prints past a 16-byte buffer', () => {
      const error = useThen('it rejects', async () =>
        getExecError({
          file: 'printf',
          args: ['%s', 'surf lesson reminders for every board in the shed'],
          options: { maxBuffer: 16 },
        }),
      );
      then('node marks it with the maxBuffer code', () => {
        expect(error).toMatchObject({
          code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER',
        });
      });
      then('it does not read as timed out', () => {
        expect(isGhCallTimedOut({ error })).toEqual(false);
      });
    });
  });

  given('[case3] an exec that exits non-zero', () => {
    when('[t0] the call fails on its own', () => {
      const error = useThen('it rejects', async () =>
        getExecError({ file: 'false', args: [], options: {} }),
      );
      then('it does not read as timed out', () => {
        expect(isGhCallTimedOut({ error })).toEqual(false);
      });
    });
  });

  given('[case4] a value that is no exec error', () => {
    then('it does not read as timed out', () => {
      expect(isGhCallTimedOut({ error: 'etimedout' })).toEqual(false);
    });
  });
});
