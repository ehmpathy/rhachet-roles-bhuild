import type { AuthSource } from './AuthSource';

/**
 * .what = where a send's identity came from, as the human reads it
 * .why = every send that knows its source names it:
 *   - as-ehmpath, from either spot            → `as-ehmpath (via keyrack|ambient)`
 *   - the default on a human's ambient email  → `as-human (via ambient email bert@example.com)`
 *        a send with no traced source shows naught
 */
export const asAuthSourceShown = (input: {
  authSource: AuthSource | null;
}): string | null => {
  if (!input.authSource) return null;
  if (input.authSource.auth === 'as-human')
    return `as-human (via ambient email ${input.authSource.email})`;
  return `as-ehmpath (via ${input.authSource.spot})`;
};
