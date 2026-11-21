import { asErrorCode } from '@src/infra/errors/asErrorCode';

/**
 * .what = sends a signal to a pid; reports whether a process was there to receive it
 * .why = a pid read from a lock may exit between the read and the signal; that race is a fact to
 *        report, never a failure to throw
 */
export const setProcessSignal = (input: {
  pid: number;
  signal: NodeJS.Signals;
}): { isReceived: boolean } => {
  try {
    process.kill(input.pid, input.signal);
    return { isReceived: true };
  } catch (error) {
    if (asErrorCode({ error }) !== 'ESRCH') throw error;
    return { isReceived: false };
  }
};
