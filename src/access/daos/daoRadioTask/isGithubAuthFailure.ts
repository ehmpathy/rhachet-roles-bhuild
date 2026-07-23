/**
 * .what = detect whether a gh cli error is a github token-auth failure (401)
 * .why = lets the gh communicator turn an auth rejection into a graceful nudge
 *        instead of a raw `Command failed` bubble that hides the fix
 *
 * .note = scoped to 401-class token-auth signals. a 403 'resource not accessible
 *   by integration' is a per-action permission issue (e.g. an app token that cannot
 *   add an assignee), NOT a token-auth failure, so it is excluded — otherwise it would
 *   clobber the best-effort assignee handler in daoRadioTaskViaGhIssues.set.upsert.
 */
export const isGithubAuthFailure = (input: { text: string }): boolean => {
  const text = input.text.toLowerCase();

  // a 403 add-assignee permission is not a token-auth failure — never match it
  if (text.includes('resource not accessible by integration')) return false;

  // 401-class token-auth signals emitted by gh / the github api
  return (
    text.includes('http 401') ||
    text.includes('bad credentials') ||
    text.includes('requires authentication') ||
    text.includes('gh auth login') ||
    text.includes('gh_token')
  );
};
