import type { RadioPushArgs } from './RadioPushArgs';

/**
 * .what = the push flags the reprinted command carries, in the order it prints them
 * .why = a contract test reads the push schema's keys against this list, so a flag added to the
 *        push but not to the reprint fails red instead of a re-run that silently drops it
 */
export const RADIO_PUSH_FLAGS_CARRIED = [
  'via',
  'into',
  'exid',
  'status',
  'title',
  'description',
  'idem',
  'auth',
  'promise',
] as const;

/**
 * .what = one value, quoted for a posix shell so it re-parses byte for byte
 * .why = a title or body may hold spaces, quotes, `$`, backticks, or newlines; a single-quoted
 *        word keeps every byte literal, and an inner `'` closes, escapes, and reopens
 */
const asShellWord = (input: { value: string }): string => {
  if (/^[A-Za-z0-9@%_+=:,./-]+$/.test(input.value)) return input.value;
  return `'${input.value.split(`'`).join(`'\\''`)}'`;
};

/**
 * .what = the exact `rhx radio.task.push` command the caller ran, with a promise added
 * .why = the nudge must hand back a command that re-runs as typed, so the only act left to the
 *        caller is the check the promise vouches for
 *
 * .note = promise null prints no `--promise` (an auth-cure re-run, owed no vouch until the repo
 *         reads public). a `--promise` the caller passed is never doubled: args carry none
 */
export const asRadioPushCommandWithPromise = (input: {
  args: RadioPushArgs;
  promise: string | null;
}): string => {
  const values: Record<
    (typeof RADIO_PUSH_FLAGS_CARRIED)[number],
    string | null
  > = {
    ...input.args,
    promise: input.promise,
  };
  const flags = RADIO_PUSH_FLAGS_CARRIED.flatMap((flag) => {
    const value = values[flag];
    if (value === null) return [];
    return [`--${flag} ${asShellWord({ value })}`];
  });
  return ['rhx radio.task.push', ...flags].join(' ');
};
