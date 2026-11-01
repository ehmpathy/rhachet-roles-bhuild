/**
 * .what = does gh error text say the repo itself cannot be seen under this auth
 * .why = gh answers "... to a Repository with the name ..." for an absent repo and for a
 *        repo the token may not read alike; neither is an absent issue, so the send must
 *        fault (another auth may reach it) rather than read as "task not found"
 */
export const isGithubRepoUnreachable = (input: { text: string }): boolean =>
  input.text.toLowerCase().includes('to a repository with the name');
