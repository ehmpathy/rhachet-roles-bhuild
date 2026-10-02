/**
 * .what = the fate of one recorded push attempt
 * .why = a record is held until a push gets it through, then settles
 *
 * .note = QUEUED    = held; the next push with an open gate delivers it
 *         DELIVERED = upstream reflects it
 *         REFUSED   = upstream refused its replay (a constraint); never retried
 */
enum RadioTaskRecordStatus {
  QUEUED = 'QUEUED',
  DELIVERED = 'DELIVERED',
  REFUSED = 'REFUSED',
}

export { RadioTaskRecordStatus };
