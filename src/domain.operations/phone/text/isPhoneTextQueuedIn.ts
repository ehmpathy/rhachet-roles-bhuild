/**
 * .what = whether a mailbox entry is a text its tree still owes a say: an `in` copy, QUEUED
 * .why = the receiver tree's daemon says each text into its own panes; the `in` copy is the one
 *        it claims and settles, and the `out` copy is the sender's mirror of it
 */
export const isPhoneTextQueuedIn = (input: {
  record: { way: string; status: string };
}): boolean => input.record.way === 'in' && input.record.status === 'QUEUED';
