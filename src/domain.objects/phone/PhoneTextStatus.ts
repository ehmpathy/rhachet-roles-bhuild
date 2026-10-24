/**
 * .what = the fate of one text record
 * .why = QUEUED, DELIVERED, REFUSED reuse the radio's record vocabulary; FAULTED and
 *        WITHDRAWN are the phone's two additions
 *
 * - QUEUED    = written, not yet said; `reason` names why it waits
 * - DELIVERED = `clone say` returned released or enqueued; never said again
 * - REFUSED   = the peer cannot exist; never retried
 * - FAULTED   = rhachet could not confirm the say; a resend could duplicate, so the sender decides
 * - WITHDRAWN = the sender ran `phone.text del` while it was QUEUED; never said
 */
export const PHONE_TEXT_STATUSES = [
  'QUEUED',
  'DELIVERED',
  'REFUSED',
  'FAULTED',
  'WITHDRAWN',
] as const;

export type PhoneTextStatus = (typeof PHONE_TEXT_STATUSES)[number];
