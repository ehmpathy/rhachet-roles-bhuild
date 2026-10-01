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
 * .what = the short reason an upstream send failed, from its error text
 * .why = a held record names why it waits: a refused token, a rate limit, or another fault
 *
 * .note = the send path surfaces faults as text (gh cli stderr), with no structured
 *         status; upstream:fault is the explicit default for text that names neither
 */
export const asRadioUpstreamReason = (input: { message: string }): string => {
  const text = input.message.toLowerCase();
  if (isAuthRejectedText({ text })) return 'upstream:401';
  if (text.includes('rate limit')) return 'upstream:rate-limit';
  return 'upstream:fault';
};
