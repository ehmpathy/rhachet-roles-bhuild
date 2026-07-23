import { ConstraintError } from 'helpful-errors';
import { given, then, useThen, when } from 'test-fns';

import { getReflectBrainContext } from './getReflectBrainContext';

/**
 * .what = capture the thrown error of a promise, or null if it succeeded
 * .why = the failure path is the behavior under test; a clean success is itself
 *        the failure, so a null return makes the assertion fail loud
 */
const asThrownError = async (run: Promise<unknown>): Promise<Error | null> =>
  run.then(
    () => null,
    (thrown: unknown) =>
      thrown instanceof Error ? thrown : new Error(String(thrown)),
  );

describe('getReflectBrainContext (integration)', () => {
  given('[case1] a brain slug that matches no installed supplier', () => {
    when('[t0] the context is requested', () => {
      const result = useThen('it settles', async () => ({
        error: await asThrownError(
          getReflectBrainContext(
            { brainSlug: 'nonesuch/does-not-exist' },
            { onFailureHint: 'a caller-specific fix hint' },
          ),
        ),
      }));

      then(
        'it fails loud with a ConstraintError, not a raw stack trace',
        () => {
          expect(result.error).toBeInstanceOf(ConstraintError);
        },
      );

      then('the error names the unreachable brain slug', () => {
        expect(result.error?.message).toContain('could not reach the brain');
        expect(result.error?.message).toContain('nonesuch/does-not-exist');
      });

      then('it carries the caller-specific fix hint and the raw cause', () => {
        if (!(result.error instanceof ConstraintError))
          throw new Error('expected a ConstraintError');
        expect(result.error.metadata.hint).toEqual(
          'a caller-specific fix hint',
        );
        expect(result.error.metadata.cause).toBeInstanceOf(Error);
      });
    });
  });
});
