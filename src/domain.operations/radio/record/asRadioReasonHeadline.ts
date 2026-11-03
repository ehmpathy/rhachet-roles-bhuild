import { asRadioFaultLineUpstream } from './asRadioFaultLineUpstream';
import { isRadioFaultLineOfUpstreamWords } from './isRadioFaultLineOfUpstreamWords';
import { isRadioTextFitForTrackedRecord } from './isRadioTextFitForTrackedRecord';
import { isRadioUpstreamReasonHalt } from './isRadioUpstreamReasonHalt';

/**
 * .what = the most characters a headline keeps
 * .why = one line a human scans; github's refusals run well under it
 */
const HEADLINE_LENGTH_MAX = 200;

/**
 * .what = the line, cut to the bound with an ellipsis where it runs past
 */
const asRadioLineBounded = (input: { line: string }): string =>
  input.line.length <= HEADLINE_LENGTH_MAX
    ? input.line
    : `${input.line.slice(0, HEADLINE_LENGTH_MAX - 1)}…`;

/**
 * .what = the one line a record keeps of what upstream said, or null
 * .why = `queue get` runs in a later process than the drain that met the fault, so the words
 *        must live on the record; the record is tracked, so only words safe to commit are kept.
 *        the one owner of "which faults keep words", so every fault branch asks it alike
 *
 * .note = a wall (a reason that halts the drain) keeps none: its words vary per attempt (a retry
 *         hint, a reset time), so a kept one would rewrite the file on each drain
 * .note = the input is upstream's fault text with the echoed command already cut
 *         (asRadioUpstreamFaultText). the upstream's line (asRadioFaultLineUpstream) is the
 *         headline. it is dropped whole, never masked, if the kept line holds a clock, an epoch, or
 *         a token (isRadioTextFitForTrackedRecord) — checked on the line and on the value returned,
 *         since the cut can shorten a long digit run into an epoch shape. only that value is
 *         written, so a stamp on a line not kept cannot reach the file
 */
export const asRadioReasonHeadline = (input: {
  reason: string;
  faultText: string;
}): string | null => {
  // a wall's words vary per attempt: keep none
  if (isRadioUpstreamReasonHalt({ reason: input.reason })) return null;

  // the line that holds the upstream's words, picked as the drain picks it
  const line = asRadioFaultLineUpstream({ text: input.faultText });
  if (!line) return null;

  // the pick fell back to a line of no words (our call, a request id): show it, never keep it,
  // since a per-request value would rewrite the tracked file on each drain
  if (!isRadioFaultLineOfUpstreamWords({ line })) return null;

  // bound it to one scannable line; keep it only if the line and the cut value are both fit
  const bounded = asRadioLineBounded({ line });
  if (!isRadioTextFitForTrackedRecord({ text: line })) return null;
  if (!isRadioTextFitForTrackedRecord({ text: bounded })) return null;
  return bounded;
};
