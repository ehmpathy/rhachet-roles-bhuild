/**
 * .what = was this drain step's bound cut below its own cap by the drain deadline
 * .why = a step that expires at its own cap is the step's fault; one that expires on a bound
 *        the deadline clipped ran out of drain, not of its own time, and must wait for the next
 */
export const isRadioDrainStepClippedByDeadline = (input: {
  cap: { milliseconds: number };
  bound: { milliseconds: number };
}): boolean => input.bound.milliseconds < input.cap.milliseconds;
