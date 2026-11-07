/**
 * .what = the one daemon outcome a send names, across every receiver tree it woke
 * .why = a send to a group may wake several trees; the line names the worst seen, so a tree with
 *        no daemon is never hidden behind one that had one. a send that woke no tree on this
 *        grove (every peer on another) names NONE: each such grove wakes its own daemon
 */
export const asPhoneDaemonOutcomeOfAll = (input: {
  outcomes: ('FOUND' | 'STARTED' | 'UNCONFIRMED')[];
}): 'FOUND' | 'STARTED' | 'UNCONFIRMED' | 'NONE' => {
  if (input.outcomes.length === 0) return 'NONE';
  if (input.outcomes.includes('UNCONFIRMED')) return 'UNCONFIRMED';
  if (input.outcomes.includes('STARTED')) return 'STARTED';
  return 'FOUND';
};
