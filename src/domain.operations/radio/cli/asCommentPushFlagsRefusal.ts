/**
 * .what = the refusal for push flags handed to radio.task.comment, or null when none were
 * .why = a title, body, or status change is a push; the refusal names each flag passed and the
 *        exact push that would carry it, so the fix is one copy away
 */
export const asCommentPushFlagsRefusal = (input: {
  title: string | undefined;
  description: string | undefined;
  status: string | undefined;
  via: string | undefined;
  into: string | undefined;
  exid: string | undefined;
}): string | null => {
  // which push flags were passed
  const flagsFound = PUSH_FLAGS.filter((flag) => input[flag] !== undefined);
  if (flagsFound.length === 0) return null;

  // name each, and the push that reads it, with the target the caller already named
  const flagsNamed = flagsFound.map((flag) => `--${flag}`).join(', ');
  const flagsForPush = flagsFound
    .map((flag) => `--${flag} <${flag}>`)
    .join(' ');
  const target = `--via ${input.via ?? '<via>'} --into ${input.into ?? '<into>'} --exid ${input.exid ?? '<n>'}`;
  const verb = flagsFound.length === 1 ? 'is' : 'are';
  return `${flagsNamed} ${verb} not read by radio.task.comment, which only adds a comment; to change a task's title, body, or status, use rhx radio.task.push ${target} ${flagsForPush}`;
};

const PUSH_FLAGS = ['title', 'description', 'status'] as const;
