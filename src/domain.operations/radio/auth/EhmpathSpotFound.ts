/**
 * .what = what one spot returned: a token, or what it held and its fix
 * .why = a miss is an answer here, never a throw, so the orchestrator can name every spot
 *        it checked; null marks a spot the caller's --auth never read
 */
export type EhmpathSpotFound =
  | { token: string }
  | { miss: { row: string; fix: string | null; cause: string | null } }
  | null;
