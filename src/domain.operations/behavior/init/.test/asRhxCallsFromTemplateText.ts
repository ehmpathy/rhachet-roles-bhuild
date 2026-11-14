/**
 * .what = extracts every `rhx <skill> …` call a template's prose names
 * .why  = a tail template asks the driver to run skills by text alone; templates.tail case5
 *         checks each call against the skill it names, so a flag the skill does not parse
 *         (e.g. `--what all` with no `--against`) goes red before a consumer meets it
 *
 * .note = reads inline backtick spans and fenced lines that open with `rhx `. a quoted value
 *         (a `--title "…"`) is one arg, so a `--` inside it is never read as a flag
 */
export const asRhxCallsFromTemplateText = (input: {
  text: string;
}): {
  raw: string;
  skill: string;
  args: string[];
  flags: string[];
}[] => {
  // gather each call: inline spans, then fenced lines
  const raws = [
    ...asRhxSpansFromText({ text: input.text }),
    ...asRhxLinesFromText({ text: input.text }),
  ];

  // split each call into its skill, args, and flags
  return raws.map((raw) => {
    const { skill, args } = asSkillAndArgsFromTokens({
      tokens: asTokensFromShellText({ text: raw }),
    });
    return { raw, skill, args, flags: asFlagsFromArgs({ args }) };
  });
};

/**
 * .what = the inline backtick spans of a text that open with `rhx `, without their backticks
 */
const asRhxSpansFromText = (input: { text: string }): string[] =>
  [...input.text.matchAll(/`(rhx [^`\n]+)`/g)].map((match) => match[1]!);

/**
 * .what = the lines of a text that open with `rhx ` once trimmed, as a fenced block holds them
 */
const asRhxLinesFromText = (input: { text: string }): string[] =>
  input.text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('rhx '));

/**
 * .what = the skill and args of a call, from its tokens; token 0 is the `rhx` word
 */
const asSkillAndArgsFromTokens = (input: {
  tokens: string[];
}): { skill: string; args: string[] } => ({
  skill: input.tokens[1] ?? '',
  args: input.tokens.slice(2),
});

/**
 * .what = the `--flag` names among a call's args; a `--flag=value` yields its name alone
 */
const asFlagsFromArgs = (input: { args: string[] }): string[] =>
  input.args
    .filter((arg) => /^--[a-z][\w.-]*/.test(arg))
    .map((arg) => arg.split('=')[0]!);

/**
 * .what = splits shell text on whitespace, with a quoted value kept as one token
 * .why  = a `--title "a --b"` must read as one arg, so its inner `--b` is never a flag
 */
const asTokensFromShellText = (input: { text: string }): string[] =>
  [...input.text.matchAll(/"[^"]*"|'[^']*'|\S+/g)].map((match) => match[0]);
