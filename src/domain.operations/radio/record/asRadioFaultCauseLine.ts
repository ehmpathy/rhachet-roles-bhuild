/**
 * .what = the exec prefix a fault text opens with once its echoed command is cut
 * .why = `Command failed: <cmd>` minus the command leaves `Command failed:`, a line that names
 *        no cause; it must never be the one line a human reads
 */
const EXEC_PREFIX_BARE = /^Command failed:?$/;

/**
 * .what = the one line of a fault text that names its cause
 * .why = a hold shows its cause in one tree branch; the first line with words of its own (what
 *        gh or the network said) is the cause, never the bare exec prefix above it
 */
export const asRadioFaultCauseLine = (input: { text: string }): string =>
  input.text
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !EXEC_PREFIX_BARE.test(line)) ??
  'no fault text';
