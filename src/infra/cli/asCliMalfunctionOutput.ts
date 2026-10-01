/**
 * .what = the stderr a cli prints for a helpful malfunction: its message once, then its frames
 * .why = node's own printer prefixes the class name to a message that already opens with
 *        `💥 MalfunctionError:`, so the human reads the class twice; this prints the message
 *        once and keeps the stack frames for the on-call engineer
 */
export const asCliMalfunctionOutput = (input: { error: Error }): string => {
  const prefix = input.error.message.includes('💥') ? '' : '💥 ';
  const frames = (input.error.stack ?? '')
    .split('\n')
    .filter((line) => /^\s+at /.test(line));
  return [`${prefix}${input.error.message}`, ...frames].join('\n');
};
