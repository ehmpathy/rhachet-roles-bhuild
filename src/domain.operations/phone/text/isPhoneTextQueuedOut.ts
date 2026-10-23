/**
 * .what = whether a mailbox entry is a text its tree still owes a say: an `out` copy, QUEUED
 */
export const isPhoneTextQueuedOut = (input: {
  record: { way: string; status: string };
}): boolean => input.record.way === 'out' && input.record.status === 'QUEUED';
