import type { EhmpathSpot } from './EhmpathSpot';

/**
 * .what = whether an --auth value reads this spot
 * .why = as-ehmpath reads both spots; each pinned value reads only its own, so a keyrack
 *        fault under via-keyrack is never masked by an ambient read
 */
export const isEhmpathSpotAllowed = (input: {
  via: EhmpathSpot | 'either';
  spot: EhmpathSpot;
}): boolean => input.via === 'either' || input.via === input.spot;
