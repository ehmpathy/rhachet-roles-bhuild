/**
 * .what = reflect on init.behavior self-reviews across the machine's transcripts
 * .how  = TypeScript implementation for reflect.on.reviews.self.sh skill
 *
 * see src/domain.roles/behaver/skills/reflect.on.reviews.self.sh for full docs
 */

import { mkdirSync, writeFileSync } from 'fs';
import { ConstraintError } from 'helpful-errors';
import { dirname } from 'path';
import { z } from 'zod';

import { genReflectionReport } from '@src/domain.operations/reflect.on.review.self/genReflectionReport';
import { genReflectionStdout } from '@src/domain.operations/reflect.on.review.self/genReflectionStdout';
import {
  getReflectBrainContext,
  REFLECT_BRAIN_SLUG,
} from '@src/domain.operations/reflect.on.review.self/getReflectBrainContext';
import {
  asDisplayPath,
  getReflectionOutputPaths,
} from '@src/domain.operations/reflect.on.review.self/getReflectionOutputPaths';
import {
  getReviewSelfReflection,
  type ReviewSelfJudge,
} from '@src/domain.operations/reflect.on.review.self/getReviewSelfReflection';
import { imagineReviewSelfVerdict } from '@src/domain.operations/reflect.on.review.self/imagineReviewSelfVerdict';
import { getCliArgs } from '@src/infra/cli';

// ────────────────────────────────────────────────────────────────────
// schema
// ────────────────────────────────────────────────────────────────────

const schemaOfArgs = z.object({
  named: z.object({
    // skill-specific args (all optional — no flags = machine-wide plan)
    mode: z.enum(['plan', 'apply']).default('plan'),
    route: z.string().optional(),
    project: z.string().optional(),
    stone: z.string().optional(),
    brain: z.string().default(REFLECT_BRAIN_SLUG),
    into: z.string().optional(),
    help: z.boolean().optional(),
    // rhachet passthrough args (optional, ignored)
    repo: z.string().optional(),
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

// ────────────────────────────────────────────────────────────────────
// exported CLI entry point
// ────────────────────────────────────────────────────────────────────

export const reflectOnReviewsSelf = async (options?: {
  argv?: string[];
  projectsDir?: string;
  judge?: ReviewSelfJudge;
  stdout?: (line: string) => void;
}): Promise<void> => {
  const { named } = getCliArgs({ schema: schemaOfArgs, argv: options?.argv });

  // the stdout sink defaults to console.log; a test may inject its own sink to
  // read what a caller sees — no spy/mock of the terminal needed
  const emit = options?.stdout ?? ((line: string) => console.log(line));

  // --help short-circuits the sweep and prints the usage guide
  if (named.help === true) {
    emit(genReflectSelfreviewsHelp());
    return;
  }

  const mode = named.mode;
  const routeFilter = named.route ?? null;
  const projectFilter = named.project ?? null;
  const stoneFilter = named.stone ?? null;

  // in apply mode, judge each window; an injected judge (a deterministic test
  // seam) wins over the real cheap-brain judge. plan mode needs no judge.
  const judge =
    mode === 'apply'
      ? (options?.judge ?? (await genBrainJudge({ brainSlug: named.brain })))
      : null;

  // run the reflection sweep
  const { aggregate, windows } = await getReviewSelfReflection(
    {
      projectFilter,
      routeFilter,
      stoneFilter,
      judge,
    },
    { projectsDir: options?.projectsDir },
  );

  // fail loud on an empty sweep — a silent empty report hides the true cause
  if (windows.length === 0)
    failOnEmptySweep({ routeFilter, projectFilter, stoneFilter, aggregate });

  // write the markdown report + json aggregate to their derived, distinct paths
  const { reportPath, jsonPath } = getReflectionOutputPaths({
    into: named.into,
    routeFilter,
  });
  // the parent dir (e.g. the machine-level ~/.rhachet/reflect) may not exist yet
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, genReflectionReport({ aggregate, windows, mode }));
  writeFileSync(jsonPath, JSON.stringify(aggregate, null, 2));

  // emit the treestruct summary to stdout — one cohesive tree that opens with the
  // behaver mascot header and closes with the wrote-section (the report + json
  // paths as tree leaves), per rule.require.treestruct-output. the artifact paths
  // ride inside the tree, not a bespoke footer glyph
  emit(
    genReflectionStdout({
      aggregate,
      mode,
      outputs: {
        reportPath: asDisplayPath({ path: reportPath }),
        jsonPath: asDisplayPath({ path: jsonPath }),
      },
    }),
  );
};

/**
 * .what = the usage guide printed on --help
 * .why = discovery of options, defaults, and modes without a trip to the docs
 */
const genReflectSelfreviewsHelp = (): string => {
  // each option is [flag, description, default]; a blank default omits the tag
  const optionRows: Array<[string, string, string]> = [
    ['--mode', 'plan (signals only) | apply (+ brain verdicts)', 'plan'],
    ['--route', 'filter to windows of one route dir', 'all routes'],
    ['--project', 'filter to one project slug', 'all projects'],
    ['--stone', 'filter to one stone (e.g. 1.vision)', 'all stones'],
    ['--brain', 'cheap brain choice for apply mode', REFLECT_BRAIN_SLUG],
    ['--into', 'report output path', '~/.rhachet/reflect, or into --route dir'],
    ['--help', 'show this guide', ''],
  ];

  // pad the flag + description columns to a shared width so every [default:]
  // tag begins at the same column — no row juts past the others (a longer
  // description no longer pushes its default out of the aligned column)
  const flagWidth = Math.max(...optionRows.map(([flag]) => flag.length));
  const descWidth = Math.max(...optionRows.map(([, desc]) => desc.length));
  const optionLines = optionRows.map(([flag, desc, def]) =>
    `  ${flag.padEnd(flagWidth)}  ${desc.padEnd(descWidth)}  ${
      def ? `[default: ${def}]` : ''
    }`.trimEnd(),
  );

  return [
    '🌲 reflect.on.reviews.self — diagnose which init.behavior self-reviews earn their keep',
    '',
    'usage:',
    '  rhx reflect.on.reviews.self [--mode plan|apply] [--route <dir>] [--project <slug>]',
    '                          [--stone <name>] [--brain <choice>] [--into <path>]',
    '',
    'options:',
    ...optionLines,
    '',
    'with no flags, the skill sweeps every transcript in every project on the machine.',
    'plan mode needs no brain; apply mode judges each window with the cheap brain.',
  ].join('\n');
};

/**
 * .what = build a per-window judge backed by the cheap brain
 * .why = apply mode enriches each window with a utility verdict; the brain-context
 *        setup is delegated to the shared communicator so the contract layer holds
 *        no raw SDK access and no duplicate the integration test also re-derives
 */
const genBrainJudge = async (input: {
  brainSlug: string;
}): Promise<ReviewSelfJudge> => {
  // build the brain context; an absent supplier, package, or credential must
  // surface as a loud, hinted ConstraintError — not a raw stack trace
  const context = await getReflectBrainContext(
    { brainSlug: input.brainSlug },
    {
      onFailureHint:
        'confirm the rhachet-brains supplier is installed and its credential is on the keyrack (owner ehmpath), or rerun with --mode plan',
    },
  );
  return ({ window }) => imagineReviewSelfVerdict({ window }, context);
};

/**
 * .what = throw a loud, hinted error when the sweep yields no windows
 * .why = the vision forbids a silent empty report — a filter that matches
 *        no transcript, or a corpus with no init.behavior route, must fail
 *        loud with the cause so the caller can act, not a clean empty success
 */
const failOnEmptySweep = (input: {
  routeFilter: string | null;
  projectFilter: string | null;
  stoneFilter: string | null;
  aggregate: { transcriptsRead: number; transcriptsSkipped: number };
}): never => {
  // collect the filters that were in play, if any
  const filters = [
    input.routeFilter ? `route=${input.routeFilter}` : null,
    input.projectFilter ? `project=${input.projectFilter}` : null,
    input.stoneFilter ? `stone=${input.stoneFilter}` : null,
  ].filter((part): part is string => part !== null);

  // a filtered miss and a machine-wide miss want different hints
  const filtered = filters.length > 0;
  throw new ConstraintError(
    filtered
      ? 'no self-review windows matched the given filters'
      : 'no init.behavior self-review windows found in the transcript corpus',
    {
      filters: filtered ? filters : null,
      corpus: '~/.claude/projects/*/*.jsonl',
      transcriptsRead: input.aggregate.transcriptsRead,
      transcriptsSkipped: input.aggregate.transcriptsSkipped,
      hint: filtered
        ? 'loosen or remove the filters, or confirm that route ran on this machine'
        : 'confirm the init.behavior route has run here — its route.stone.set commands must appear in a transcript',
    },
  );
};
