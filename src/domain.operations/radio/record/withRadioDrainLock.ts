import { join } from 'path';
import { createCache } from 'simple-on-disk-cache';
import { withSimpleMutex } from 'with-simple-mutex';

/**
 * .what = the dir that holds the worktree's radio locks
 * .why = a drain reaches every record dir in the worktree, so one lock spans them all;
 *        an on-disk cache here makes the lock per-machine, which covers every push process
 */
const asRadioLockDir = (input: { cwd: string }): string =>
  join(input.cwd, '.behavior', '.radio', '.locks');

/**
 * .what = run a drain while it holds the worktree's drain lock
 * .why = two drains that read one backlog at once each send every record in it, and the
 *        upstream findsert is check-then-write, so the race doubles a task upstream (X2).
 *        under the lock, the second drain reads the backlog only after the first has
 *        marked its records delivered, so it skips them
 *
 * .note = with-simple-mutex owns the lock lifecycle: an atomic put-if-absent picks one
 *         holder, the lease expires a crashed holder's lock, and a wait past the acquire
 *         bound throws SimpleMutexAcquireTimeoutError rather than hang
 */
export const withRadioDrainLock = <
  TInput,
  TContext extends { cwd: string },
  TOutput,
>(
  logic: (input: TInput, context: TContext) => Promise<TOutput>,
) => {
  return async (input: TInput, context: TContext): Promise<TOutput> => {
    // the lock state lives on disk, so a guard built per call still shares it across calls
    const drainGuarded = withSimpleMutex(
      async (args: { input: TInput; context: TContext }) =>
        logic(args.input, args.context),
      {
        key: () => 'radio.drain',
        cache: createCache({
          directory: { local: { path: asRadioLockDir(context) } },
        }),
        lease: { duration: { minutes: 5 } },
        acquire: {
          timeout: { minutes: 2 },
          interval: { milliseconds: 50 },
        },
      },
    );
    return drainGuarded({ input, context });
  };
};
