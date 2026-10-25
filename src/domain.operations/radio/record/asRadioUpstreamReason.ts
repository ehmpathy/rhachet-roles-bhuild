/**
 * .what = does this error text report a rejected credential
 * .why = a 401 must be read as a status, never as any "401" in the text
 *        (a line number, a byte count, an address)
 */
const isAuthRejectedText = (input: { text: string }): boolean =>
  input.text.includes('github auth failed') ||
  input.text.includes('bad credentials') ||
  /\bhttp[ /.\d]*401\b|\bstatus:? ?401\b|\(401\)/.test(input.text);

/**
 * .what = does this error text report a write the credential may not make
 * .why = a 403 or an app with no grant on the target is a fault of this one record's
 *        target under its auth; another auth (as-human) may pass it
 */
const isAccessRefusedText = (input: { text: string }): boolean =>
  input.text.includes('resource not accessible') ||
  input.text.includes('must have admin rights') ||
  /\bhttp[ /.\d]*403\b|\bstatus:? ?403\b|\(403\)/.test(input.text);

/**
 * .what = does this error text report a repo the credential cannot see at all
 * .why = github answers "... to a Repository with the name ..." both for an absent repo
 *        and for one the auth may not read, so it is a fault of this record, never a true
 *        absence of the issue
 */
const isRepoUnreachableText = (input: { text: string }): boolean =>
  input.text.includes('to a repository with the name');

/**
 * .what = does this error text report a fault of the network or of github itself
 * .why = a wall every record behind would meet too; the drain halts on it (F1)
 */
const isTransientText = (input: { text: string }): boolean =>
  /\bhttp[ /.\d]*5\d\d\b|\bstatus:? ?5\d\d\b|\(5\d\d\)/.test(input.text) ||
  /\b(econnreset|econnrefused|etimedout|enotfound|eai_again|enetunreach)\b/.test(
    input.text,
  ) ||
  input.text.includes('dial tcp') ||
  input.text.includes('connection refused') ||
  input.text.includes('i/o timeout') ||
  input.text.includes('tls handshake timeout') ||
  input.text.includes('network is unreachable');

/**
 * .what = the short reason an upstream send failed, from its error text
 * .why = a held record names why it waits, and the reason decides whether the drain halts
 *
 * .note = the send path surfaces faults as text (gh cli stderr), with no structured
 *         status; upstream:fault is the explicit default for text that names none.
 *         a miss on the transient set lands on upstream:fault, which sets one record
 *         aside rather than halt — the safe side
 */
export const asRadioUpstreamReason = (input: { message: string }): string => {
  const text = input.message.toLowerCase();
  if (isAuthRejectedText({ text })) return 'upstream:401';
  if (text.includes('rate limit')) return 'upstream:rate-limit';
  if (isRepoUnreachableText({ text })) return 'upstream:not-found';
  if (isAccessRefusedText({ text })) return 'upstream:access';
  if (isTransientText({ text })) return 'upstream:transient';
  return 'upstream:fault';
};
