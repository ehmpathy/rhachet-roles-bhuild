/**
 * .what = how many times a flag appears in argv, in `--flag v` or `--flag=v` form
 * .why  = getCliArgs is last-wins on a repeat, so a repeat must be counted before it parses
 */
export const getFlagCount = (input: { argv: string[]; flag: string }): number =>
  input.argv.filter(
    (arg) => arg === `--${input.flag}` || arg.startsWith(`--${input.flag}=`),
  ).length;
