import { RADIO_GH_SEND_DEADLINE } from '@src/access/daos/daoRadioTask/RADIO_GH_SEND_DEADLINE';
import { RADIO_GH_SEND_TIMEOUT } from '@src/access/daos/daoRadioTask/RADIO_GH_SEND_TIMEOUT';

import { asRadioDrainLeaseMargin } from './asRadioDrainLeaseMargin';

/**
 * .what = a send budget for one drain: is it spent yet
 * .why = the drain lock holds a lease (withRadioDrainLock); a drain that sends past it loses
 *        the lock while it still sends, and a second drain could then double-send (X2). the
 *        drain starts no new send once its budget is spent, so it ends well inside the lease
 *
 * .note = reads the process's monotonic clock (hrtime), in memory only; no time is stored
 *         or written. hrtime, not Date or performance: a test that pins the wall clock
 *         (jest fake timers) must not spend the budget
 */
export const genRadioDrainSendBudget = (input: {
  budget: { milliseconds: number };
}): { isSpent: () => boolean } => {
  const startedNs = process.hrtime.bigint();
  const budgetNs = BigInt(Math.round(input.budget.milliseconds * 1_000_000));
  return {
    isSpent: () => process.hrtime.bigint() - startedNs >= budgetNs,
  };
};

/**
 * .what = the default lease of the drain lock: 5.5 minutes — the root bound of a drain
 * .why = the lock starts the drain deadline from it (lease less margin, genRadioDrainDeadline),
 *        and every step of the drain is cut to that deadline, so the lease never expires on a
 *        drain in flight (X2) whichever step stalls. the send budget is derived from it below
 */
export const RADIO_DRAIN_LOCK_LEASE_DEFAULT = { milliseconds: 5.5 * 60_000 };

/**
 * .what = the default bound on one send: each gh call, and the whole send
 * .why = one send makes several gh calls; each is cut to what the send has left, and the
 *        send to what the drain has left
 */
export const RADIO_DRAIN_SEND_LIMIT_DEFAULT = {
  perCall: RADIO_GH_SEND_TIMEOUT,
  perSend: RADIO_GH_SEND_DEADLINE,
};

/**
 * .what = the cap on one record's auth derive: 60s (a shell auth, a keyrack get or unlock)
 * .why = a vault wait or a hardware prompt must not hold the line; it is also cut to what the
 *        drain has left
 */
export const RADIO_DRAIN_AUTH_DERIVE_CAP = { milliseconds: 60_000 };

/**
 * .what = the default send budget of a drain, derived: lease − margin − one send = 3 minutes
 * .why = after it, the drain starts no new send, so a send begun at the budget's edge still
 *        gets its full deadline; the drain deadline is the hard bound, this the soft one
 */
export const RADIO_DRAIN_SEND_BUDGET_DEFAULT = {
  milliseconds:
    RADIO_DRAIN_LOCK_LEASE_DEFAULT.milliseconds -
    asRadioDrainLeaseMargin({ lease: RADIO_DRAIN_LOCK_LEASE_DEFAULT })
      .milliseconds -
    RADIO_DRAIN_SEND_LIMIT_DEFAULT.perSend.milliseconds,
};

/**
 * .what = the default bound on a wait for the drain lock: 2 minutes
 * .why = a `queue set`, `queue del`, or drain behind a live drain gives up loud, never hangs;
 *        it is not tied to the lease, since a waiter retries rather than outlasts a drain
 */
export const RADIO_DRAIN_LOCK_ACQUIRE_TIMEOUT_DEFAULT = {
  milliseconds: 2 * 60_000,
};
