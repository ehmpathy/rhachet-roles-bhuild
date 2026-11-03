/**
 * .what = the clock shape the repo's timestamp gate halts on (`T?HH:MM:SS`, any zone after)
 * .why = a record file is tracked; text the gate would halt must never be kept
 * .note = mirrors TIMESTAMP_PATTERN in .husky/check.timestamps.sh, which matches without a
 *         zone too, so the zone is left out here as well. it does not strip durations first as
 *         the gate does, so a duration also fails: a stricter read, never a looser
 */
const CLOCK_SHAPE = /T?\d{2}:\d{2}:\d{2}/;

/**
 * .what = the shape of an epoch: a bare run of 10 to 13 digits (seconds or milliseconds)
 * .why = rule.forbid.timestamps-in-tracked-files forbids an epoch too, and the gate cannot see
 *        one, so the writer must. a rate-limit reset (`x-ratelimit-reset: 1730557331`) is one
 * .note = it cannot tell an epoch from any other long number, so any such run fails: the guard
 *         fails toward no text, never toward a kept stamp
 */
const EPOCH_SHAPE = /(?<!\d)\d{10,13}(?!\d)/;

/**
 * .what = the shapes a github credential takes
 * .why = a token must never reach a tracked file, whatever echoed it
 */
const TOKEN_SHAPE =
  /\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b|\bbearer\s+\S{20,}/i;

/**
 * .what = whether free text from upstream is safe to keep in a tracked record file
 * .why = one owner for the rule, so every writer of upstream words onto a record asks the same
 *        question: no clock, no epoch, no token
 */
export const isRadioTextFitForTrackedRecord = (input: {
  text: string;
}): boolean =>
  !CLOCK_SHAPE.test(input.text) &&
  !EPOCH_SHAPE.test(input.text) &&
  !TOKEN_SHAPE.test(input.text);
