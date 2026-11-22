import type { EhmpathSpot } from './EhmpathSpot';

/**
 * .what = the spot an as-ehmpath send paid from, as the human reads it
 * .why = as-ehmpath alone has two possible sources, so its output names which one paid;
 *        every other value has one source, and shows naught
 */
export const asEhmpathSpotShown = (input: {
  ehmpathSpot: EhmpathSpot | null;
}): string | null =>
  input.ehmpathSpot ? `as-ehmpath (via ${input.ehmpathSpot})` : null;
