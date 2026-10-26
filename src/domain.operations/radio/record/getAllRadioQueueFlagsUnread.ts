/**
 * .what = the flags each queue verb reads
 * .why = one table names, per verb, what it acts on; any other flag is one it would ignore
 */
const FLAGS_READ_BY_VERB: Record<'get' | 'set' | 'del' | 'drain', string[]> = {
  get: ['when'],
  set: ['key', 'auth', 'description', 'title'],
  del: ['key', 'why'],
  drain: ['auth'],
};

/**
 * .what = the flags read by every verb: help, and the rhachet dispatch args
 * .why = rhachet passes repo/role/skill to every skill; they are never the caller's ask
 */
const FLAGS_READ_BY_ALL: string[] = ['help', 'h', 'repo', 'role', 'skill', 's'];

/**
 * .what = the flags passed to a queue verb that the verb does not read, plus the ones it does
 * .why = a flag a verb ignores is a silent surprise: `drain --key K` would send the whole
 *        line, and `drain --mode plan` would send for real; the caller must hear it first
 */
export const getAllRadioQueueFlagsUnread = (input: {
  verb: 'get' | 'set' | 'del' | 'drain';
  flags: string[];
}): { unread: string[]; accepted: string[] } => ({
  unread: input.flags.filter(
    (flag) =>
      !FLAGS_READ_BY_ALL.includes(flag) &&
      !FLAGS_READ_BY_VERB[input.verb].includes(flag),
  ),
  accepted: FLAGS_READ_BY_VERB[input.verb],
});
