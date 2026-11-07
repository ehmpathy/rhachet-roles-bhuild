/**
 * .what = every value a repeatable flag carries, in the order given, in either form:
 *         `--<key> <value>` or `--<key>=<value>`
 * .why = `getCliArgs` keeps one value per key, the last; a flag that repeats for a list
 *        (`--to a --to b`) needs all of them
 */
export const getAllCliArgValues = (input: {
  key: string;
  argv: string[];
}): string[] =>
  input.argv.flatMap((arg, index) => {
    // the joined form carries its value inline
    const prefixJoined = `--${input.key}=`;
    if (arg.startsWith(prefixJoined)) return [arg.slice(prefixJoined.length)];

    // the spaced form carries its value in the next arg
    const next = input.argv[index + 1];
    return arg === `--${input.key}` &&
      next !== undefined &&
      !next.startsWith('--')
      ? [next]
      : [];
  });
