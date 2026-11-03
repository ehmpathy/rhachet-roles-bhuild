import { isRadioFaultLineOfUpstreamWords } from './isRadioFaultLineOfUpstreamWords';

/**
 * .what = the one line of a fault's text that holds the upstream's own words, or null
 * .why = the drain prints it and the record keeps it; one pick, so `drain` and `queue get` show
 *        the same line for the same fault
 *
 * .note = the first non-blank line, trimmed, that holds the upstream's words. an exec failure
 *         leads with `Command failed: <the command>`; a raw response may echo a request id. those
 *         lines yield to the first line of words. when no line of words is there, the first line
 *         is shown so the drain still prints aught; asRadioReasonHeadline refuses to keep it
 */
export const asRadioFaultLineUpstream = (input: {
  text: string | null;
}): string | null => {
  const lines = (input.text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return (
    lines.find((line) => isRadioFaultLineOfUpstreamWords({ line })) ??
    lines[0] ??
    null
  );
};
