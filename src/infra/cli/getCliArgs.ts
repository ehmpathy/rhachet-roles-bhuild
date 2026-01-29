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
    const errorOutput = genCliArgsErrorStdout({ issues: result.error.issues });
    console.error(errorOutput);
    process.exit(1);
  }

  return result.data;
};

/**
 * .what = generates human-friendly CLI error output from Zod issues
 * .why = raw Zod errors are unclear for CLI users
 */
export const genCliArgsErrorStdout = (input: {
  issues: z.ZodIssue[];
}): string => {
  const lines: string[] = ['⛈️  error: input invalid'];

  for (let i = 0; i < input.issues.length; i++) {
    const issue = input.issues[i]!;
    const isLast = i === input.issues.length - 1;
    const prefix = isLast ? '└─' : '├─';

    // cast path to (string | number)[] since Zod's PropertyKey[] includes symbols we don't use
    const path = issue.path as (string | number)[];
    const flag = genCliFlagFromZodPath({ path });
    const message = genCliMessageFromZodIssue({ issue });
    lines.push(`   ${prefix} ${flag} ${message}`);
  }

  return lines.join('\n');
};

/**
 * .what = converts Zod path array to CLI flag format
 * .why = "named.name" should display as "--name"
 */
const genCliFlagFromZodPath = (input: {
  path: (string | number)[];
}): string => {
  // handle ordered (positional) arguments
  if (input.path[0] === 'ordered') {
    const index = input.path[1];
    if (typeof index === 'number') return `argument[${index}]`;
    return 'argument';
  }

  // filter out "named" prefix and join rest of the parts
  const parts = input.path.filter((p) => p !== 'named');

  if (parts.length === 0) return 'argument';

  // convert to --flag format
  const flagName = parts.join('.');
  return `--${flagName}`;
};

/**
 * .what = converts Zod issue to human-friendly message
 * .why = "Invalid input: expected string, received undefined" is unclear
 *
 * .note = uses `any` casts because Zod 4.x types differ from runtime shape
 */
const genCliMessageFromZodIssue = (input: { issue: z.ZodIssue }): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issue = input.issue as any;

  // handle "received undefined" as "is required"
  if (issue.code === 'invalid_type' && issue.received === 'undefined') {
    return 'is required';
  }

  // handle type mismatch
  if (issue.code === 'invalid_type') {
    return `must be a ${issue.expected}, got ${issue.received}`;
  }

  // handle enum errors
  if (issue.code === 'invalid_enum_value') {
    const options = issue.options.map((o: string) => `"${o}"`).join(', ');
    return `must be one of: ${options}`;
  }

  // handle string too short
  if (issue.code === 'too_small' && issue.type === 'string') {
    return `must be at least ${issue.minimum} character(s)`;
  }

  // handle string too long
  if (issue.code === 'too_big' && issue.type === 'string') {
    return `must be at most ${issue.maximum} character(s)`;
  }

  // fallback to Zod's message
  return issue.message.toLowerCase();
};
