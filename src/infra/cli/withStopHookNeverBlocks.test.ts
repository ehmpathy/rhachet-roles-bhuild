import {
  BadRequestError,
  ConstraintError,
  getError,
  MalfunctionError,
} from 'helpful-errors';
import { given, then, useThen, when } from 'test-fns';

import { withStopHookNeverBlocks } from './withStopHookNeverBlocks';

/**
 * .what = run the wrapper with a recorder for its log lines and exit code
 * .why = the wrapper exits the process in a stop hook run; the test must observe, not exit
 */
const runWrapped = async (input: { error: Error; argv: string[] }) => {
  const lines: string[] = [];
  const codes: number[] = [];
  const error = await getError(
    withStopHookNeverBlocks(
      async () => {
        throw input.error;
      },
      {
        argv: input.argv,
        log: (line) => lines.push(line),
        exit: (code) => codes.push(code),
      },
    )(),
  ).catch(() => null);
  return { lines, codes, error };
};

describe('withStopHookNeverBlocks', () => {
  given('[case1] a stop hook run', () => {
    const argv = ['--when', 'hook.onStop'];

    when('[t0] the wrapped logic throws a ConstraintError', () => {
      const result = useThen('it runs', async () =>
        runWrapped({
          error: new ConstraintError('repo cannot be empty'),
          argv,
        }),
      );

      then('it exits 1, never 2, so the stop is not blocked', () => {
        expect(result.codes).toEqual([1]);
      });

      then('the header keeps its ConstraintError class, once', () => {
        expect(result.lines).toHaveLength(1);
        expect(result.lines[0]).toContain(
          '✋ ConstraintError: repo cannot be empty',
        );
        expect(result.lines[0]).not.toContain('MalfunctionError');
      });
    });

    when('[t1] the wrapped logic throws a MalfunctionError', () => {
      const thrown = new MalfunctionError('record unreadable');
      const result = useThen('it runs', async () =>
        runWrapped({ error: thrown, argv }),
      );

      then('it passes through as is (exit 1 via the cli)', () => {
        expect(result.error).toBe(thrown);
        expect(result.codes).toEqual([]);
      });
    });
  });

  given('[case2] a run outside the stop hook', () => {
    when('[t0] the wrapped logic throws a BadRequestError', () => {
      const thrown = new BadRequestError('bad arg');
      const result = useThen('it runs', async () =>
        runWrapped({ error: thrown, argv: [] }),
      );

      then('it passes through as is, so the cli still exits 2', () => {
        expect(result.error).toBe(thrown);
        expect(result.codes).toEqual([]);
      });
    });
  });
});
