import { z } from 'zod';

/**
 * .what = base schema for rhachet passthrough args
 *
 * .why  = all CLI entry points must accept these optional args
 *         so they can be invoked via rhachet skill dispatch
 */
export const schemaOfRhachetArgs = z.object({
  repo: z.string().optional(),
  role: z.string().optional(),
  skill: z.string().optional(),
  s: z.string().optional(),
});

export type RhachetArgs = z.infer<typeof schemaOfRhachetArgs>;

/**
 * .what = parse CLI args into raw { named, ordered } structure
 *
 * .why  = internal function that handles raw parsing before schema validation
 */
const getCliArgsRaw = (
  argv: string[],
): { named: Record<string, string | boolean>; ordered: string[] } => {
  const named: Record<string, string | boolean> = {};
  const ordered: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;

    // skip end-of-options marker
    if (arg === '--') continue;

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];

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
      const next = argv[i + 1];

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
 *         with Zod validation. rhachet args (repo, role, skill, s) should
 *         be declared as optional in the schema so they are parsed and ignored.
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
/**
 * .what = type constraint for CLI schemas that include rhachet args
 *
 * .why  = enforces at compile time that all CLI schemas extend the base rhachet args
 */
type CliSchemaWithRhachetArgs = z.ZodObject<{
  named: z.ZodObject<
    z.ZodRawShape & {
      repo: z.ZodOptional<z.ZodString>;
      role: z.ZodOptional<z.ZodString>;
      skill: z.ZodOptional<z.ZodString>;
      s: z.ZodOptional<z.ZodString>;
    }
  >;
  ordered: z.ZodArray<z.ZodString> | z.ZodDefault<z.ZodArray<z.ZodString>>;
}>;

export const getCliArgs = <T extends CliSchemaWithRhachetArgs>(input: {
  schema: T;
  argv?: string[];
}): z.infer<T> => {
  // drop script filename from argv if present
  //
  // rhachet skills use `tsx -e "import('pkg').then(m => m.cli.X())"` which
  // has no script filename - argv[1] is already the first user arg.
  //
  // direct invocation like `tsx src/contract/cli/bind.behavior.ts` puts
  // the script path in argv[1], which we need to skip.
  //
  // we detect the script filename by checking for `/cli/` in the path,
  // since all CLI entry points live in src/contract/cli/.
  const argvFirstIsScriptFilename = process.argv[1]?.includes('/cli/');
  const argvWithoutScriptFilename = argvFirstIsScriptFilename
    ? process.argv.slice(2)
    : process.argv.slice(1);
  const argv = input.argv ?? argvWithoutScriptFilename;
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
