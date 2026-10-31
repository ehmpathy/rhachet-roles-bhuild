import type { RadioDrainDeadline } from './genRadioDrainDeadline';

/**
 * .what = the bound on one drain step: its own cap, or what the drain has left, whichever is less
 * .why = a step may never run past the drain deadline, however large its own cap
 */
export const asRadioDrainStepBound = (input: {
  cap: { milliseconds: number };
  deadline: RadioDrainDeadline;
}): { milliseconds: number } => ({
  milliseconds: Math.max(
    0,
    Math.min(input.cap.milliseconds, input.deadline.getMillisecondsLeft()),
  ),
});
