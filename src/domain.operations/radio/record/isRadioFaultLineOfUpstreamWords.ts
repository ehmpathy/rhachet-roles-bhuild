/**
 * .what = the shapes of a line that is our own text — our call, our error, our hint — or a value
 *         that differs per request
 * .why = none holds the upstream's words. our own error would read on `get` as if upstream said
 *        it: a real 401 surfaces as our token check's `✋ ConstraintError: … rejected by github
 *        (401)` plus a `• unblock now …` hint, and neither line is github's. a per-request value
 *        kept on a tracked record would rewrite its file on each drain of the same fault
 * .note = a refusal we wrap still keeps its words: github's line rides on its own line inside our
 *         error, and that line matches none of these shapes
 */
const LINE_NOT_WORDS_SHAPES = [
  /Command failed:/, // our own exec header, with a temp path that differs each run
  /\b(?:Constraint|Malfunction|BadRequest|UnexpectedCodePath)Error:/, // our own error header
  /^•\s/, // our own hint bullet, e.g. `• unblock now — re-run as human`
  /^x-[\w-]+:/i, // a response header echo, e.g. x-github-request-id
  /request[- ]?id/i, // a request id, under any label
];

/**
 * .what = whether a line of fault text holds the upstream's words, not our own text nor a
 *         per-request value
 * .why = the drain may show any line, but a record keeps only a line of words; one test serves
 *        both, so the two never disagree on what counts as words
 */
export const isRadioFaultLineOfUpstreamWords = (input: {
  line: string;
}): boolean => !LINE_NOT_WORDS_SHAPES.some((shape) => shape.test(input.line));
