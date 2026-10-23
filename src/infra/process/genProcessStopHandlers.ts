/**
 * .what = registers one handler for SIGTERM and SIGINT; returns the call that unregisters both
 * .why = the receive half of the process signal boundary, beside `setProcessSignal` (the send
 *        half), so a domain loop composes a named step and never touches `process` itself
 */
export const genProcessStopHandlers = (input: {
  onStop: () => void;
}): { delHandlers: () => void } => {
  process.once('SIGTERM', input.onStop);
  process.once('SIGINT', input.onStop);
  return {
    delHandlers: () => {
      process.off('SIGTERM', input.onStop);
      process.off('SIGINT', input.onStop);
    },
  };
};
