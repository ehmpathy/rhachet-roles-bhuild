import type { EhmpathSpotFound } from './EhmpathSpotFound';

/**
 * .what = the misses of every spot read, in read order
 * .why = the miss message names each spot checked; a spot never read adds no row
 */
export const asEhmpathAuthMisses = (input: {
  founds: EhmpathSpotFound[];
}): { row: string; fix: string | null; cause: string | null }[] =>
  input.founds.flatMap((found) =>
    found && 'miss' in found ? [found.miss] : [],
  );
