import { type IsoDuration, toMilliseconds } from 'iso-time';

/**
 * .what = how many polls of one span fit in a wait, rounded up
 * .why = a bounded wait loop reads as a poll budget, never as millisecond division
 */
export const getOnePollCount = (input: {
  wait: IsoDuration;
  poll: IsoDuration;
}): number =>
  Math.ceil(toMilliseconds(input.wait) / toMilliseconds(input.poll));
