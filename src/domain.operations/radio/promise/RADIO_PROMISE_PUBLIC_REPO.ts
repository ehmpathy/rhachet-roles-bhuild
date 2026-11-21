/**
 * .what = the one promise a push to a public repo must carry
 * .why = a task text sent to a public repo cannot be taken back (an edit keeps the original in
 *        public history), so the sender vouches, in words that name the claim, that the text
 *        was checked for private detail before it goes out
 */
export const RADIO_PROMISE_PUBLIC_REPO = 'task-to-public-repo-is-anonymized';
