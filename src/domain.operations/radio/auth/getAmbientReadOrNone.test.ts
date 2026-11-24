import { BadRequestError, ConstraintError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { AMBIENT_READ_GH_LOGIN } from './AMBIENT_READ_GH_LOGIN';
import { AmbientReadFaultError } from './AmbientReadFaultError';
import { getAmbientReadOrNone } from './getAmbientReadOrNone';

/**
 * .what = unit tests for the one ambient read: the "none" exit, a value, and a box fault
 * .why  = a box fault must never read as "none", and must reach the drain as a held auth fault
 *         (a BadRequestError), never an abort of the whole drain
 *
 * .grain = UNIT. a fake shx answers from a table; no shell runs
 */
describe('getAmbientReadOrNone', () => {
  const envStubbed = { RADIO_GH_STUB: '1' };

  // a fake shx that answers one way for every command
  const genFakeShx =
    (input: { answer: string | { exit: number | null } }) =>
    async (command: string) => {
      if (typeof input.answer === 'string')
        return { stdout: input.answer, stderr: '' };
      throw Object.assign(new Error(`Command failed: ${command}`), {
        code: input.answer.exit ?? undefined,
        killed: input.answer.exit === null,
      });
    };

  given('[case1] a read that prints a value', () => {
    when('[t0] the read runs', () => {
      then('the trimmed value returns', async () => {
        const value = await getAmbientReadOrNone(
          { command: 'git config user.email' },
          {
            env: envStubbed,
            shx: genFakeShx({ answer: 'bert@example.com\n' }),
          },
        );
        expect(value).toEqual('bert@example.com');
      });
    });
  });

  given('[case2] a read that exits 1, the documented "none"', () => {
    when('[t0] the read runs', () => {
      then('null returns', async () => {
        const value = await getAmbientReadOrNone(
          { command: AMBIENT_READ_GH_LOGIN },
          { env: envStubbed, shx: genFakeShx({ answer: { exit: 1 } }) },
        );
        expect(value).toEqual(null);
      });
    });
  });

  given('[case3] a read that exits 127, gh not installed', () => {
    when('[t0] the read runs', () => {
      then(
        'a ConstraintError names the command, the exit, and the fix; the drain can hold it',
        async () => {
          const error = await getError(
            getAmbientReadOrNone(
              { command: AMBIENT_READ_GH_LOGIN },
              { env: envStubbed, shx: genFakeShx({ answer: { exit: 127 } }) },
            ),
          );
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error).toBeInstanceOf(AmbientReadFaultError);
          expect(error.message).toContain('gh auth token` failed (exit 127)');
          expect(error.message).toContain('--auth as-ehmpath-via-keyrack');
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case4] a test env with no stub gh declared', () => {
    when('[t0] the read runs', () => {
      then('it refuses before any shell runs', async () => {
        const calls: string[] = [];
        const error = await getError(
          getAmbientReadOrNone(
            { command: AMBIENT_READ_GH_LOGIN },
            {
              env: { JEST_WORKER_ID: '1' },
              shx: async (command) => {
                calls.push(command);
                return { stdout: '', stderr: '' };
              },
            },
          ),
        );
        expect(error).toBeInstanceOf(ConstraintError);
        expect(calls).toEqual([]);
      });
    });
  });
});
