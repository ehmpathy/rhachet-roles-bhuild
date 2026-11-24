/**
 * .what = cast the comma-separated `--lane-wout` value into its list of lane slugs
 * .why  = the flag is one comma-separated string, never a repeated flag (a repeated flag is
 *         last-wins in getCliArgs); blanks and stray commas yield no slug
 */
export const asLaneSlugList = (input: { raw: string | null }): string[] =>
  (input.raw ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
