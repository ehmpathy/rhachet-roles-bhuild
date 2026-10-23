import { asErrorCode } from '@src/infra/errors/asErrorCode';

/**
 * .what = is a process with this pid alive on this grove
 * .why = a lock or a claim that names a dead pid is stale, and the next holder may reclaim it
 */
export const isPidAlive = (input: { pid: number }): boolean => {
  // a pid no process could hold is never alive; a corrupt lock or claim must read stale
  if (!isPidInRange({ pid: input.pid })) return false;

  try {
    process.kill(input.pid, 0);
    return true;
  } catch (error) {
    // EPERM means the pid lives, under another user; ESRCH means it is gone
    const code = asErrorCode({ error });
    if (code === 'EPERM') return true;
    if (code === 'ESRCH') return false;
    throw error;
  }
};

/**
 * .what = is this a pid the kernel could hand out: a positive 32-bit integer
 */
const isPidInRange = (input: { pid: number }): boolean =>
  Number.isInteger(input.pid) && input.pid > 0 && input.pid <= 2147483647;
