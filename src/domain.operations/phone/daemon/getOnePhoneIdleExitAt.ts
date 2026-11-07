import {
  addDuration,
  type IsoDuration,
  type IsoTimeStamp,
  now,
} from 'iso-time';

/**
 * .what = the instant a daemon may rest, if no QUEUED text shows before it
 * .why = each tick that sees a QUEUED text pushes the rest out by the whole idle span
 */
export const getOnePhoneIdleExitAt = (input: {
  idleExit: IsoDuration;
}): IsoTimeStamp => addDuration(now(), input.idleExit);
