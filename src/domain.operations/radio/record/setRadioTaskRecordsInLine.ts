import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioFateUnreachedByBudget } from './asRadioFateUnreachedByBudget';
import type { RadioDrainDeadline } from './genRadioDrainDeadline';
import {
  genRadioDrainSendBudget,
  RADIO_DRAIN_SEND_BUDGET_DEFAULT,
} from './genRadioDrainSendBudget';
import { isRadioDrainDeadlineNear } from './isRadioDrainDeadlineNear';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';
import type { ShellExecutor } from './ShellExecutor';
import {
  type RadioTaskRecordLineProgress,
  setRadioTaskRecordNextInLine,
} from './setRadioTaskRecordNextInLine';

/**
 * .what = send each record in line, one at a time; stop at the first fault that halts
 * .why = records after a halt stay held in their place, behind the fault
 *
 * .note = a promise fold, not recursion: the stack depth stays constant however large
 *         the backlog a long block leaves behind
 * .note = once the send budget is spent, no new send starts: the rest stay QUEUED and
 *         untouched, for the next drain, so the drain ends inside its lock lease (X2).
 *         context.drainSendBudget bounds it (default 3m)
 * .note = the drain deadline (context.drainDeadline, the lock's) is the hard bound: no
 *         record starts once too little of it is left (isRadioDrainDeadlineNear)
 */
export const setRadioTaskRecordsInLine = async (
  input: { line: { record: RadioTaskRecord; dir: string }[] },
  context: {
    cwd: string;
    homeDir: string | undefined;
    env: NodeJS.ProcessEnv;
    shx: ShellExecutor;
    authOverride?: string | null;
    authLive?: { key: string; auth: string | null } | null;
    drainSendBudget?: { milliseconds: number };
    drainSendLimit?: {
      perCall: { milliseconds: number };
      perSend: { milliseconds: number };
    };
    drainDeadline: RadioDrainDeadline;
  },
): Promise<RadioTaskRecordFate[]> => {
  // the budget starts with the line
  const budget = genRadioDrainSendBudget({
    budget: context.drainSendBudget ?? RADIO_DRAIN_SEND_BUDGET_DEFAULT,
  });

  // fold each record into the line, in order
  const progressStart = (async (): Promise<RadioTaskRecordLineProgress> => ({
    fates: [],
    halter: null,
  }))();
  const progress = await input.line.reduce(async (priorPromise, entry) => {
    const prior = await priorPromise;

    // past the budget, or too near the drain deadline: leave it queued and unsent
    if (
      budget.isSpent() ||
      isRadioDrainDeadlineNear({ deadline: context.drainDeadline })
    )
      return {
        ...prior,
        fates: [
          ...prior.fates,
          asRadioFateUnreachedByBudget({ record: entry.record }),
        ],
      };
    return setRadioTaskRecordNextInLine({ prior, entry }, context);
  }, progressStart);
  return progress.fates;
};
