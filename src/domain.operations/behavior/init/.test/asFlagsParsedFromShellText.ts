/**
 * .what = the flags a shell skill parses: the patterns of its `case` arms, comment lines dropped
 * .why  = a flag named only in a header comment, an `echo`, or a usage block is no parse; the
 *         tail clamp grades each call against the arm that reads it, never the prose around it
 *
 * .note = an arm reads `--a)`, `--a|--b)`, `"--a")`, or `--a=*)`; each alternative that opens
 *         with a dash is a flag. a body on the same line (`--a) X="$2"; shift 2 ;;`) still counts
 */
export const asFlagsParsedFromShellText = (input: { text: string }): string[] => {
  // drop comment lines, so a header that names a flag parses naught
  const lines = input.text
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'));

  // read each case-arm pattern: dash-led alternatives joined by `|`, closed by `)`
  const patterns = lines.flatMap((line) => {
    const match = line.match(
      /^\s*((?:['"]?-[\w.-]+(?:=\*)?['"]?\s*\|\s*)*['"]?-[\w.-]+(?:=\*)?['"]?)\s*\)/,
    );
    return match ? [match[1]!] : [];
  });

  // split each pattern into its flags, quotes and the `=*` glob shed
  const flags = patterns.flatMap((pattern) =>
    pattern
      .split('|')
      .map((alt) => alt.trim().replace(/^['"]|['"]$/g, '').replace(/=\*$/, '')),
  );
  return [...new Set(flags)];
};
