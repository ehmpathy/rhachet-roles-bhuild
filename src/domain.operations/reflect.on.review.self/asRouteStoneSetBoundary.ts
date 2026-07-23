/**
 * .what = a parsed `route.stone.set` command — the boundary marker of a review
 * .why = the trigger (`--as passed`) and close (`--as promised --that <slug>`)
 *        commands delimit the chained self-review windows
 */
export interface RouteStoneSetBoundary {
  /**
   * the `--as` verb: passed | promised | approved | blocked | arrived
   */
  as: string;

  /**
   * the `--stone` value (e.g., '1.vision')
   */
  stone: string;

  /**
   * the `--route` value (e.g., '.behavior/v2026_07_07.fix-behavior-selfreviews')
   */
  route: string;

  /**
   * the `--that` slug, when the verb is 'promised' (else null)
   */
  slug: string | null;
}

/**
 * .what = parse a bash command string into a route.stone.set boundary, or null
 * .why = detects the deterministic delimiters of self-review windows within a
 *        transcript, and identifies which route+stone+slug they belong to
 *
 * .note = matches both `rhx route.stone.set ...` and
 *         `npx rhachet run ... --skill route.stone.set ...` invocations
 */
export const asRouteStoneSetBoundary = (input: {
  command: string;
}): RouteStoneSetBoundary | null => {
  const command = input.command;

  // must be a route.stone.set invocation
  const isRouteStoneSet =
    command.includes('route.stone.set') || command.includes('route.stone set');
  if (!isRouteStoneSet) return null;

  // must carry an `--as` verb
  const as = asFlagValue({ command, flag: 'as' });
  if (!as) return null;

  // must carry stone + route to be attributable
  const stone = asFlagValue({ command, flag: 'stone' });
  const route = asFlagValue({ command, flag: 'route' });
  if (!stone || !route) return null;

  return {
    as,
    stone,
    route,
    slug: asFlagValue({ command, flag: 'that' }),
  };
};

/**
 * .what = extract the value that follows `--<flag>` in a command string
 * .why = the boundary fields (as, stone, route, that) are all `--flag value`
 */
const asFlagValue = (input: {
  command: string;
  flag: string;
}): string | null => {
  // match `--flag value` where value is the next whitespace-delimited token
  const pattern = new RegExp(`--${input.flag}\\s+(\\S+)`);
  const found = input.command.match(pattern);
  if (!found) return null;
  return asUnquoted({ token: found[1]! });
};

/**
 * .what = strip one pair of wrapper quotes from a token
 * .why = a quoted flag value (e.g. `--route "…"`) would otherwise carry a lead
 *        quote, so `route.startsWith('.behavior/')` would fail and the window
 *        would silently vanish — a false-negative worse than a loud skip. real
 *        route paths hold no spaces, so the un-quoted token is the whole value
 */
const asUnquoted = (input: { token: string }): string => {
  const { token } = input;
  const isDoubleQuoted = token.startsWith('"') && token.endsWith('"');
  const isSingleQuoted = token.startsWith("'") && token.endsWith("'");
  if ((isDoubleQuoted || isSingleQuoted) && token.length >= 2)
    return token.slice(1, -1);
  return token;
};
