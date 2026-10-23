/**
 * .what = pick the actor name from what gh and git reported
 * .why = the fallback order is the decision; keep it pure so a unit test
 *        can assert it without a spawn or a network call
 */
export const asCurrentActor = (input: {
  ghLogin: string | null;
  gitName: string | null;
}): string => {
  // prefer the github login; it names the account that acts upstream
  const ghLogin = input.ghLogin?.trim() ?? '';
  if (ghLogin) return ghLogin;

  // fall back to the local git name
  const gitName = input.gitName?.trim() ?? '';
  if (gitName) return gitName;

  // neither answered
  return 'unknown';
};
