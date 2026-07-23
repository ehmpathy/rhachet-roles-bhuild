/**
 * .what = build the graceful nudge for a github auth rejection at the gh boundary
 * .why = a rejected token must not dead-end in a raw `Command failed` bubble; the
 *        caller needs the immediate unblock. the nudge branches on auth role so it
 *        never loops a human back to the mode they are already in.
 *
 * .note = the as-robot advice is source-agnostic: the token may come from keyrack,
 *   env, or shx, and this boundary does not know which — so the two bullets advise
 *   the universal `--auth as-human` unblock and a source-agnostic token fix (check
 *   scopes/expiry), and do NOT name a keyrack-specific fix (that would mislead
 *   env/shx callers). the two-bullet shape mirrors the keyrack nudge for symmetry.
 *
 * .branches
 *   - as-human → advise `gh auth login` (the gh-native session fix)
 *   - as-robot → advise `--auth as-human` (the universal unblock)
 */
export const getGithubAuthFailureMessage = (input: {
  role: 'as-robot' | 'as-human';
}): string => {
  if (input.role === 'as-human')
    return [
      'github auth failed: your gh cli session is not authenticated',
      '  • log in to github: gh auth login',
    ].join('\n');
  return [
    'github auth failed: the robot token was rejected by github (401)',
    '  • unblock now — re-run as human: --auth as-human',
    '  • or fix the robot token: check its scopes and expiry at its source',
  ].join('\n');
};
