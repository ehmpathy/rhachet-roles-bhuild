/**
 * .what = the time-of-day pattern the commit gate forbids, as .husky/check.timestamps.sh declares it
 * .why = a test that proves a file holds no clock must grade it by the gate's own rule, not a
 *        hand-written cousin; getTimestampFound.integration.test.ts holds this copy equal to the hook
 */
export const TIMESTAMP_PATTERN_OF_HOOK =
  'T?[0-9][0-9]:[0-9][0-9]:[0-9][0-9](Z|[+-][0-9][0-9]:?[0-9][0-9])?';

/**
 * .what = the iso-8601 duration pattern the gate strips before it scans
 * .why = a duration is a fixed span, never a drift, so the gate lets it through
 */
export const DURATION_PATTERN_OF_HOOK =
  'P([0-9]+[YMWD])*T([0-9]+[HMS])*[0-9][0-9]:[0-9][0-9]:[0-9][0-9]';

/**
 * .what = the first line of content the commit gate would reject for a timestamp, or null
 * .why = one check for every test that asserts a written file or task body holds no clock
 *
 * .note = mirrors the gate line by line: strip durations, then scan for a time of day
 */
export const getTimestampFound = (input: { content: string }): string | null =>
  input.content
    .split('\n')
    .map((line) => line.replace(new RegExp(DURATION_PATTERN_OF_HOOK, 'g'), ''))
    .find((line) => new RegExp(TIMESTAMP_PATTERN_OF_HOOK).test(line)) ?? null;
