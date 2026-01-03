import type { z } from 'zod';

import { stripRhachetArgs } from './stripRhachetArgs';

/**
 * .what = parse CLI args into raw { named, ordered } structure
 *
 * .why  = internal function that handles raw parsing before schema validation
 */
const getCliArgsRaw = (
  argv: string[],
): { named: Record<string, string | boolean>; ordered: string[] } => {
  const args = stripRhachetArgs(argv);

  const named: Record<string, string | boolean> = {};
  const ordered: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];

      // check if next arg is a value (not another flag)
      if (next && !next.startsWith('--')) {
        named[key] = next;
        i++; // skip the value
      } else {
        // flag without value = boolean true
        named[key] = true;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      // short flag like -v
      const key = arg.slice(1);
      const next = args[i + 1];

      if (next && !next.startsWith('-')) {
        named[key] = next;
        i++;
      } else {
        named[key] = true;
      }
    } else {
      // positional arg
      ordered.push(arg);
    }
  }

  return { named, ordered };
};

/**
 * .what = parse and validate CLI args against a Zod schema
 *
 * .why  = provides type-safe arg parsing across all CLI entry points
 *         with automatic rhachet arg stripping and Zod validation
 *
 * usage:
 *   const schemaOfArgs = z.object({
 *     named: z.object({
 *       name: z.string(),
 *       verbose: z.boolean().default(false),
 *     }),
 *     ordered: z.array(z.string()).default([]),
 *   });
 *   const args = getCliArgs({ schema: schemaOfArgs });
 *   // args.named = { name: 'foo', verbose: true }
 *   // args.ordered = ['positional1', 'positional2']
 */
export const getCliArgs = <
  T extends z.ZodObject<{
    named: z.ZodObject<z.ZodRawShape>;
    ordered: z.ZodArray<z.ZodString> | z.ZodDefault<z.ZodArray<z.ZodString>>;
  }>,
>(input: {
  schema: T;
  argv?: string[];
}): z.infer<T> => {
  const argv = input.argv ?? process.argv.slice(2);
  const raw = getCliArgsRaw(argv);

  // validate against schema
  const result = input.schema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => {
        const path = issue.path.join('.');
        return `  ${path}: ${issue.message}`;
      })
      .join('\n');
    console.error('error: invalid arguments');
    console.error(errors);
    process.exit(1);
  }

  return result.data;
};
