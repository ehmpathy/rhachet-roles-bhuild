import type { EhmpathSpotFound } from './EhmpathSpotFound';

/**
 * .what = the metadata an as-ehmpath miss throws with
 * .why = a failed keyrack auto-unlock keeps its raw cause, as the extant keyrack nudge does;
 *        every other miss carries only the --auth value
 */
export const asEhmpathAuthMissMetadata = (input: {
  auth: string | null;
  keyrackFound: EhmpathSpotFound;
}): { auth: string | null; unlockFailure?: string } => {
  const unlockFailure =
    input.keyrackFound && 'miss' in input.keyrackFound
      ? input.keyrackFound.miss.cause
      : null;
  if (!unlockFailure) return { auth: input.auth };
  return { auth: input.auth, unlockFailure };
};
