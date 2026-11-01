import { ConstraintError } from 'helpful-errors';
import { join } from 'path';
import { createCache } from 'simple-on-disk-cache';
import {
  SimpleMutexAcquireTimeoutError,
  SimpleMutexLeaseExpiredError,
  withSimpleMutex,
} from 'with-simple-mutex';

import {
  genRadioDrainDeadline,
  type RadioDrainDeadline,
} from './genRadioDrainDeadline';
import {
  RADIO_DRAIN_LOCK_ACQUIRE_TIMEOUT_DEFAULT,
  RADIO_DRAIN_LOCK_LEASE_DEFAULT,
} from './genRadioDrainSendBudget';
import { genRadioLockDirIgnore } from './genRadioLockDirIgnore';

/**
 * .what = the dir that holds the worktree's radio locks
 * .why = a drain reaches every record dir in the worktree, so one lock spans them all;
 *        an on-disk cache here makes the lock per-machine, which covers every push process
 */
const asRadioLockDir = (input: { cwd: string }): string =>
  join(input.cwd, '.behavior', '.radio', '.locks');

/**
 * .what = how long a call may wait for the lock before it says it waits
 * .why = an uncontended acquire takes milliseconds; past this beat, another holder has it
 */
const RADIO_DRAIN_LOCK_WAIT_NOTICE_AFTER: { milliseconds: number } = {
  milliseconds: 750,
};

/**
 * .what = run a drain while it holds the worktree's drain lock
 * .why = two drains that read one backlog at once each send every record in it, and the
 *        upstream findsert is check-then-write, so the race doubles a task upstream (X2).
 *        under the lock, the second drain reads the backlog only after the first has
 *        marked its records delivered, so it skips them
 *
 * .note = with-simple-mutex owns the lock lifecycle: an atomic put-if-absent picks one
 *         holder, the lease expires a crashed holder's lock, and a wait past the acquire
 *         bound throws SimpleMutexAcquireTimeoutError rather than hang; that one error is
 *         recast as a ConstraintError that names the fix, since `queue set`, `queue del`
 *         and `drain` all wait here. context.lockAcquireTimeout bounds the wait
 * .note = the lease (context.lockLease) is a hard deadline the library races against the
 *         work; it cannot stop a send in flight. so the lock owns the drain's one deadline:
 *         the moment it is held, it starts `drainDeadline` (lease less margin) and hands it
 *         to the logic on its context. each step of the drain that can stall reads it, and
 *         none starts or runs past it, so the drain ends inside the lease by construction,
 *         whichever step stalls. an overrun still possible (a record write that hangs):
 *         SimpleMutexLeaseExpiredError is recast as a ConstraintError that names the fix.
 *         the two recasts key on the library's own error classes (instanceof); the drain
 *         logic holds no mutex of its own, so neither can come from a nested lock
 */
export const withRadioDrainLock = <
  TInput,
  TContext extends {
    cwd: string;
    lockAcquireTimeout?: { milliseconds: number };
    lockLease?: { milliseconds: number };
    onLockWait?: (() => void) | null;
  },
  TOutput,
>(
  logic: (
    input: TInput,
    context: TContext & { drainDeadline: RadioDrainDeadline },
  ) => Promise<TOutput>,
): ((input: TInput, context: TContext) => Promise<TOutput>) => {
  return async (input: TInput, context: TContext): Promise<TOutput> => {
    // the lock file holds a lease clock; keep the whole lock dir out of git
    const lockDir = asRadioLockDir(context);
    genRadioLockDirIgnore({ dir: lockDir });
    const lease = context.lockLease ?? RADIO_DRAIN_LOCK_LEASE_DEFAULT;

    // a call still not inside the lock after a beat waits on another holder: say so once,
    // so a `queue del` mid-drain never sits silent for up to two minutes
    const wait = { entered: false };
    const waitNotice = context.onLockWait
      ? setTimeout(() => {
          if (!wait.entered) context.onLockWait?.();
        }, RADIO_DRAIN_LOCK_WAIT_NOTICE_AFTER.milliseconds)
      : null;

    // the lock state lives on disk, so a guard built per call still shares it across calls
    const drainGuarded = withSimpleMutex(
      async (args: { input: TInput; context: TContext }) => {
        wait.entered = true;

        // the lease clock starts now, so the drain's deadline starts with it
        const drainDeadline = genRadioDrainDeadline({ lease });
        return logic(args.input, { ...args.context, drainDeadline });
      },
      {
        key: () => 'radio.drain',
        cache: createCache({
          directory: { local: { path: lockDir } },
        }),
        lease: { duration: lease },
        acquire: {
          timeout:
            context.lockAcquireTimeout ??
            RADIO_DRAIN_LOCK_ACQUIRE_TIMEOUT_DEFAULT,
          interval: { milliseconds: 50 },
        },
      },
    );
    // a wait past the bound, or a run past the lease, names the human's fix;
    // every other error passes unchanged
    return drainGuarded({ input, context })
      .finally(() => {
        if (waitNotice) clearTimeout(waitNotice);
      })
      .catch((error: unknown) => {
        if (error instanceof SimpleMutexLeaseExpiredError)
          throw new ConstraintError(
            'this drain ran past its lock lease; records not yet settled stay held; run rhx radio.task.queue drain again',
            { lockDir, cause: error },
          );
        if (!(error instanceof SimpleMutexAcquireTimeoutError)) throw error;
        throw new ConstraintError(
          'another drain holds the radio lock, so this call gave up its wait. wait for that drain to end, then retry; see the line with: rhx radio.task.queue get',
          { lockDir, cause: error },
        );
      });
  };
};
