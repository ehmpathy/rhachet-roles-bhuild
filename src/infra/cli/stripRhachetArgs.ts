/**
 * .what = strips rhachet passthrough args from argv
 *
 * .why  = rhachet passes args like --repo, --role, --skill, -s
 *         that are meant for rhachet dispatch, not the skill itself.
 *         this utility removes them so skill arg parsers don't fail
 *         on unknown arguments.
 *
 * usage:
 *   const args = stripRhachetArgs(process.argv.slice(2));
 *   // now parse args with your skill-specific logic
 */
export const stripRhachetArgs = (args: string[]): string[] => {
  const result: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    // skip rhachet passthrough args and their values
    if (
      arg === '--skill' ||
      arg === '--repo' ||
      arg === '--role' ||
      arg === '-s'
    ) {
      i++; // skip the value too
      continue;
    }

    // skip end-of-options marker
    if (arg === '--') {
      continue;
    }

    result.push(arg);
  }

  return result;
};
