import type { EhmpathSpot } from './EhmpathSpot';

/**
 * .what = where a send's identity came from
 * .why = the human reads which identity sent, and from where:
 *   - as-ehmpath names the spot that paid (keyrack or ambient), on every as-ehmpath* value and
 *     the default on an ehmpath box
 *   - the default sends as-human when the ambient email is a human's, so its source says so and
 *     names that email; a misconfigured email then shows up in the output, never a silent send
 *
 * .note = the derive always returns it where it knows it; asAuthSourceShown alone decides what
 *         reads. null where the value names a source the derive does not trace (as-robot:*,
 *         explicit as-human, the default on a box with no email)
 */
export type AuthSource =
  | { auth: 'as-ehmpath'; spot: EhmpathSpot }
  | { auth: 'as-human'; spot: 'ambient'; email: string };
