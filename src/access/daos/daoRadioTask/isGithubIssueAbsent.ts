/**
 * .what = does gh error text say the issue number itself is absent from a reachable repo
 * .why = only a true absence may read as "no such task"; a dns fault (`could not resolve
 *        host`), an auth fault, or an absent token must surface as a fault, never as null
 *
 * .note = gh answers an absent issue number with "could not resolve to an issue or pull
 *         request with the number of N"; the match is that phrase alone
 */
export const isGithubIssueAbsent = (input: { text: string }): boolean =>
  input.text
    .toLowerCase()
    .includes('could not resolve to an issue or pull request');
