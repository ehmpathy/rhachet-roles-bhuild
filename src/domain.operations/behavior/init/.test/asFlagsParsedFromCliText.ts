/**
 * .what = the flags a node cli parses: the top-level keys of its `named: z.object({ … })`, as `--kebab`
 * .why  = a launcher skill (`exec node -e "… m.cli.x()"`) holds no parser of its own; its flags
 *         live in the cli schema, so the tail clamp grades a launcher call against that schema
 *
 * .note = only depth-0 keys count: a nested `z.object` inside `named` is a value shape, not a
 *         flag, and its keys must never read as flags (a false green)
 */
export const asFlagsParsedFromCliText = (input: { text: string }): string[] => {
  // find where the named schema body opens
  const opener = input.text.match(/named:\s*z\.object\(\{/);
  if (!opener || opener.index === undefined) return [];
  const bodyStart = opener.index + opener[0].length;

  // walk the body to its matched close, and keep only the text at depth 0
  const walk = [...input.text.slice(bodyStart)].reduce(
    (state, char) => {
      if (state.done) return state;
      if ('({['.includes(char))
        return { ...state, depth: state.depth + 1, flat: state.flat + (state.depth === 0 ? char : '') };
      if (')}]'.includes(char)) {
        if (state.depth === 0) return { ...state, done: true };
        return { ...state, depth: state.depth - 1 };
      }
      return { ...state, flat: state.flat + (state.depth === 0 ? char : '') };
    },
    { depth: 0, flat: '', done: false },
  );

  // each `key:` at the head of a depth-0 line is one flag
  const keys = [...walk.flat.matchAll(/^\s*(\w+)\s*:/gm)].map((match) => match[1]!);

  // a camelCase key parses as its kebab flag
  return keys.map(
    (key) => `--${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
  );
};
