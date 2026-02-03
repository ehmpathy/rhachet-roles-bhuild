/**
 * .what = lifecycle states of a radio task
 * .why = tracks task progress from broadcast to completion
 */
enum RadioTaskStatus {
  QUEUED = 'QUEUED',
  CLAIMED = 'CLAIMED',
  DELIVERED = 'DELIVERED',
}

const isRadioTaskStatus = (value: unknown): value is RadioTaskStatus =>
  Object.values(RadioTaskStatus).includes(value as RadioTaskStatus);

export { RadioTaskStatus, isRadioTaskStatus };
