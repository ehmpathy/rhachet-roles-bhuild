/**
 * .what = the code node sets on an exec whose output overran maxBuffer
 */
const EXEC_MAXBUFFER_CODE = 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER';

/**
 * .what = was this gh exec killed by its timeout
 * .why = node sets `killed` on a timeout and on a maxBuffer overrun alike; only a timeout is a
 *        wall that halts the drain. an overrun is a fault of this one call, so it must not
 *        read as `etimedout` and hold the whole line
 *
 * .note = checks `code` and `signal` before `killed`: an overrun carries the maxBuffer code; a
 *         timeout carries no code and the kill signal (SIGTERM, exec's default)
 */
export const isGhCallTimedOut = (input: { error: unknown }): boolean => {
  // only an exec error object carries these fields
  if (typeof input.error !== 'object' || input.error === null) return false;
  const { error } = input;

  // an overrun of maxBuffer is not a timeout, though node marks it killed
  const code = 'code' in error ? error.code : null;
  if (code === EXEC_MAXBUFFER_CODE) return false;

  // a timeout: killed, by the kill signal, with no exit code of its own
  const signal = 'signal' in error ? error.signal : null;
  const killed = 'killed' in error ? error.killed : false;
  return killed === true && signal === 'SIGTERM' && code == null;
};
