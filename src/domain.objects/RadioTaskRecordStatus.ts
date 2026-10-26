/**
 * .what = the fate of one recorded push attempt
 * .why = a record is held until a push gets it through, then settles
 *
 * .note = QUEUED    = held; the next push with an open gate delivers it
 *         DELIVERED = upstream reflects it
 *         REFUSED   = upstream refused its replay (a constraint); no drain retries it;
 *                     any push of the same task re-queues it, a human's or a clone's alike
 *         DROPPED   = a human or clone dropped it via `radio.task.queue del`, with a why;
 *                     never sent, its body kept; any push of the same task re-queues it,
 *                     a human's or a clone's alike
 */
enum RadioTaskRecordStatus {
  QUEUED = 'QUEUED',
  DELIVERED = 'DELIVERED',
  REFUSED = 'REFUSED',
  DROPPED = 'DROPPED',
}

export { RadioTaskRecordStatus };
