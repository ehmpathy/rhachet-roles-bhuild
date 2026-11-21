/**
 * .what = whether a target repo's text is world-readable, as read from upstream
 * .why = a task text sent to a public repo cannot be taken back, so the push gate must know
 *        the target's visibility before it sends, and must tell a read it could not make
 *        apart from a repo it read as private
 *
 * .note = public     = world-readable; a text push owes a promise
 *         private    = readable by members only
 *         internal   = readable by the org's enterprise only
 *         unreadable = the read failed (absent repo, a bad token, an off-shape answer); a text
 *                      push owes a promise, since the gate cannot prove the repo is not public
 */
type RadioRepoVisibility = 'public' | 'private' | 'internal' | 'unreadable';

export type { RadioRepoVisibility };
