import type { RadioDrainDeadline } from './genRadioDrainDeadline';

/**
 * .what = the least time a drain must have left to start a record: 250ms
 * .why = below it, no auth derive or gh call could finish, so the record would only
 *        start a send the deadline then cuts
 */
export const RADIO_DRAIN_RECORD_START_FLOOR = { milliseconds: 250 };

/**
 * .what = is the drain too near its deadline to start another step
 * .why = the drain refuses to start a record, and a send its first call, past this point;
 *        the record stays QUEUED and unsent, for the next drain
 */
export const isRadioDrainDeadlineNear = (input: {
  deadline: RadioDrainDeadline;
}): boolean =>
  input.deadline.getMillisecondsLeft() <
  RADIO_DRAIN_RECORD_START_FLOOR.milliseconds;
