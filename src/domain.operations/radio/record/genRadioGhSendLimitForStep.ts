import type { RadioGhSendLimit } from '@src/domain.objects/RadioContext';

import { asRadioDrainStepBound } from './asRadioDrainStepBound';
import type { RadioDrainDeadline } from './genRadioDrainDeadline';
import { RADIO_DRAIN_SEND_LIMIT_DEFAULT } from './genRadioDrainSendBudget';
import { genRadioGhSendLimit } from './genRadioGhSendLimit';

/**
 * .what = the time bound on one gh step of a send, started now: its per-call cap, and its whole
 *         bound cut to what the drain has left
 * .why = the visibility read and the request each start a step; each must end before the
 *        drain lease does, so each takes its bound from the drain deadline at the moment it starts
 */
export const genRadioGhSendLimitForStep = (input: {
  sendLimit:
    | {
        perCall: { milliseconds: number };
        perSend: { milliseconds: number };
      }
    | undefined;
  deadline: RadioDrainDeadline;
}): RadioGhSendLimit => {
  const sendLimit = input.sendLimit ?? RADIO_DRAIN_SEND_LIMIT_DEFAULT;
  return genRadioGhSendLimit({
    perCall: sendLimit.perCall,
    perSend: asRadioDrainStepBound({
      cap: sendLimit.perSend,
      deadline: input.deadline,
    }),
  });
};
